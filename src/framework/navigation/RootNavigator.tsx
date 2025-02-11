/**
 * Startup is a conditionnaly rendered content based on app startup status.
 * It can render the SplashScreen, auth flow or main flow in function of token loading and status.
 */
import * as React from 'react';
import { Linking, Platform, StatusBar } from 'react-native';

import inAppMessaging from '@react-native-firebase/in-app-messaging';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { navigationRef } from './helper';
import { useMainNavigation } from './mainNavigation';
import modals from './modals/navigator';
import { getTypedRootStack } from './navigators';
import { getState as getAppStartupState, StartupState } from './redux';

import { useAppStartup } from '~/app/startup';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import SnowFlakes from '~/framework/components/SnowFlakes';
import { RootToastHandler } from '~/framework/components/toast';
import type { AuthLoggedAccountMap } from '~/framework/modules/auth/model';
import useAuthNavigation from '~/framework/modules/auth/navigation/main-account/navigator';
import { getAuthNavigationState, getFirstTabRoute } from '~/framework/modules/auth/navigation/main-account/router';
import { getState as getAuthState, IAuthState } from '~/framework/modules/auth/reducer';
import appConf from '~/framework/util/appConf';
import { AppPushNotificationHandlerComponent } from '~/framework/util/notifications/cloudMessaging';
import { useNavigationSnowHandler } from '~/framework/util/tracker/useNavigationSnow';
import { useNavigationTracker } from '~/framework/util/tracker/useNavigationTracker';

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
  const { accounts, appReady, connected, dispatch, lastAddAccount, lastDeletedAccount, pending, requirement, showOnboarding } =
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
  const mainNavigation = useMainNavigation(session);
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
          ['$tab.myapps']: {
            screens: {
              ['blog']: 'deeplinks/blog',
            },
          },
          ['$tab.conversation']: 'deeplinks/conv',
          ['$tab.timeline']: 'deeplinks/timeline',
          ['$tab.user']: 'deeplinks/user',
        },
      },
    },
  };

  const appUrlDeeplink = appConf?.deeplinks?.url;
  const appNameDeeplink = appConf?.deeplinks?.name;

  const linking = {
    prefixes: [appUrlDeeplink, `${appNameDeeplink}://`],

    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url) {
        await Linking.openURL(url);
      }

      return url;
    },

    subscribe(listener) {
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        console.error(url, 'test léa');
        listener(url);
      });

      return () => {
        linkingSubscription.remove();
      };
    },

    config,
  };

  // ex branche léa
  // const linking = {
  //   prefixes: [appConf.deeplinks?.urlscheme, `https://${appConf.deeplinks?.url}`],

  //   async getInitialURL() {
  //     const url = await Linking.getInitialURL();
  //     if (url) {
  //       await Linking.openURL(url);
  //     }

  //     return url;
  //   },

  //   subscribe(listener) {
  //     const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
  //       console.error(url, 'test léa');
  //       listener(url);
  //     });

  //     return () => {
  //       linkingSubscription.remove();
  //     };
  //   },

  //   config,
  // };

  const ret = React.useMemo(() => {
    return (
      <>
        <SplashScreenComponent key={appReady} />
        {appReady ? (
          <NavigationContainer
            // key={lastAddAccount}
            ref={navigationRef}
            initialState={navigationState}
            linking={linking}
            onStateChange={onStateChange}>
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
  accounts: getAuthState(state).accounts,
  appReady: getAppStartupState(state).isReady,
  connected: getAuthState(state).connected,
  lastAddAccount: getAuthState(state).lastAddAccount,
  lastDeletedAccount: getAuthState(state).lastDeletedAccount,
  pending: getAuthState(state).pending,
  requirement: getAuthState(state).requirement,
  showOnboarding: getAuthState(state).showOnboarding,
}))(RootNavigator);
