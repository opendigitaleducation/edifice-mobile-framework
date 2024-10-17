/**
 * Startup is a conditionnaly rendered content based on app startup status.
 * It can render the SplashScreen, auth flow or main flow in function of token loading and status.
 */
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import * as React from 'react';
import { Linking, Platform, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { useAppStartup } from '~/app/startup';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import SnowFlakes from '~/framework/components/SnowFlakes';
import { RootToastHandler } from '~/framework/components/toast';
import type { AuthLoggedAccountMap } from '~/framework/modules/auth/model';
import useAuthNavigation from '~/framework/modules/auth/navigation/main-account/navigator';
import { getAuthNavigationState, getFirstTabRoute } from '~/framework/modules/auth/navigation/main-account/router';
import { IAuthState, getState as getAuthState } from '~/framework/modules/auth/reducer';
import { AppPushNotificationHandlerComponent } from '~/framework/util/notifications/cloudMessaging';
import { useNavigationSnowHandler } from '~/framework/util/tracker/useNavigationSnow';
import { useNavigationTracker } from '~/framework/util/tracker/useNavigationTracker';

import appConf from '~/framework/util/appConf';
import { navigationRef } from './helper';
import { useMainNavigation } from './mainNavigation';
import modals from './modals/navigator';
import { getTypedRootStack } from './navigators';
import { StartupState, getState as getAppStartupState } from './redux';

function SplashScreenComponent() {
  React.useEffect(() => {
    return () => {
      SplashScreen.hide();
      inAppMessaging().setMessagesDisplaySuppressed(false).finally();
    };
  }, []);
  return null;
}

export interface RootNavigatorStoreProps {
  pending: IAuthState['pending'];
  accounts: IAuthState['accounts'];
  showOnboarding: IAuthState['showOnboarding'];
  appReady: StartupState['isReady'];
  connected: IAuthState['connected'];
  requirement: IAuthState['requirement'];
  lastAddAccount: IAuthState['lastAddAccount'];
  lastDeletedAccount: IAuthState['lastDeletedAccount'];
  dispatch: Dispatch;
}
export type RootNavigatorProps = RootNavigatorStoreProps;

const RootStack = getTypedRootStack();

function RootNavigator(props: RootNavigatorProps) {
  const { accounts, pending, showOnboarding, dispatch, appReady, requirement, connected, lastAddAccount, lastDeletedAccount } =
    props;

  React.useEffect(() => {
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(theme.palette.primary.regular);
  }, []);

  // App Startup

  useAppStartup(dispatch);

  // Get navigation state from redux state
  // Only if app is ready, and if the used is not logged in. (If logged, no navState goes to the timeline)

  const session = connected ? (props.accounts as AuthLoggedAccountMap)[connected] : undefined;
  const isMainNavigationAccessible = session && !requirement;

  const navigationState = React.useMemo(
    () =>
      appReady && !isMainNavigationAccessible
        ? getAuthNavigationState(accounts, pending, showOnboarding, requirement, lastDeletedAccount)
        : getFirstTabRoute(),
    [accounts, appReady, isMainNavigationAccessible, lastDeletedAccount, pending, requirement, showOnboarding],
  );
  const navStateJSON = JSON.stringify(navigationState);

  // Auth/Main switch
  const mainNavigation = useMainNavigation(session?.rights.apps ?? [], session?.rights.widgets ?? []);
  const authNavigation = useAuthNavigation();
  const routes = React.useMemo(() => {
    return isMainNavigationAccessible ? mainNavigation : authNavigation;
  }, [authNavigation, isMainNavigationAccessible, mainNavigation]);

  // === Render navigation container with initialState ===

  const trackNavState = useNavigationTracker();
  const manageNavSnow = useNavigationSnowHandler(dispatch);

  // Everytime computed navigationState changes, we need to update it in navigationRef by hand ===
  React.useLayoutEffect(() => {
    // useLayoutEffect is used to prevent to have a one-frame flash showing the old navigation state
    if (navigationState && navigationRef.isReady()) {
      console.debug('[Navigation] Reset root navigator state : ' + navStateJSON);
      navigationRef.reset(navigationState);
    }
    trackNavState(navigationState);
    // We use `navStateJSON` as a dependency to avoid resetting when new nav state is identical to the previous one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStateJSON, trackNavState]);

  const onStateChange = React.useCallback(
    (state: NavigationState | undefined) => {
      trackNavState(state);
      manageNavSnow();
    },
    [manageNavSnow, trackNavState],
  );

  const screenOptions = React.useMemo(() => ({ headerShown: true }), []);
  const config = {
    screens: {
      $tabs: {
        screens: {
          ['$tab.myapps']: 'myapps',
          ['$tab.conversation']: 'conversation',
        },
      },
    },
  };

  const linking = {
    prefixes: ['devpocketapp://', `https://${appConf.deeplinks?.url}`],

    // Custom function to get the URL which was used to open the app
    async getInitialURL() {
      // First, you would need to get the initial URL from your third-party integration
      // The exact usage depend on the third-party SDK you use
      // For example, to get the initial URL for Firebase Dynamic Links:
      //const { isAvailable } = utils().playServicesAvailability;

      // if (isAvailable) {
      //   const initialLink = await dynamicLinks().getInitialLink();

      //   if (initialLink) {
      //     return initialLink.url;
      //   }
      // }

      // As a fallback, you may want to do the default deep link handling
      const url = await Linking.getInitialURL();
      console.debug(url, 'test léa 1');

      return url;
    },

    // Custom function to subscribe to incoming links
    subscribe(listener) {
      // Listen to incoming links from Firebase Dynamic Links
      // const unsubscribeFirebase = dynamicLinks().onLink(({ url }) => {
      //   listener(url);
      // });

      // Listen to incoming links from deep linking
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        console.error(url, 'test léaaa');
        listener(url);
      });

      return () => {
        // Clean up the event listeners
        //unsubscribeFirebase();
        linkingSubscription.remove();
      };
    },

    config,
  };

  const ret = React.useMemo(() => {
    return (
      <>
        <SplashScreenComponent key={appReady} />
        {appReady ? (
          <NavigationContainer
            // key={lastAddAccount}
            ref={navigationRef}
            initialState={navigationState}
            onStateChange={onStateChange}
            linking={linking}>
            <AppPushNotificationHandlerComponent>
              <RootStack.Navigator screenOptions={screenOptions}>
                {routes}
                {modals}
              </RootStack.Navigator>
            </AppPushNotificationHandlerComponent>
            <RootToastHandler />
            <SnowFlakes />
          </NavigationContainer>
        ) : null}
      </>
    );
  }, [appReady, lastAddAccount, navigationState, onStateChange, routes, screenOptions]);

  return ret;
}

export default connect((state: IGlobalState) => ({
  appReady: getAppStartupState(state).isReady,
  pending: getAuthState(state).pending,
  showOnboarding: getAuthState(state).showOnboarding,
  accounts: getAuthState(state).accounts,
  connected: getAuthState(state).connected,
  requirement: getAuthState(state).requirement,
  lastAddAccount: getAuthState(state).lastAddAccount,
  lastDeletedAccount: getAuthState(state).lastDeletedAccount,
}))(RootNavigator);
