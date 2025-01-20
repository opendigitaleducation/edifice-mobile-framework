import * as React from 'react';

import { createNavigationContainerRef, NavigationContainer, NavigationState } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import type { AuthAddAccountModalScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { PageView } from '~/framework/components/page';
import { useConstructor } from '~/framework/hooks/constructor';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import useAuthNavigation from '~/framework/modules/auth/navigation/add-account/navigator';
import { getAddAccountNavigationState } from '~/framework/modules/auth/navigation/add-account/router';
import { actions, getState } from '~/framework/modules/auth/reducer';
import { INavigationParams } from '~/framework/navigation/helper';
import { navBarOptions } from '~/framework/navigation/navBar';
import { getTypedRootStack } from '~/framework/navigation/navigators';
import { useNavigationSnowHandler } from '~/framework/util/tracker/useNavigationSnow';
import { useNavigationTracker } from '~/framework/util/tracker/useNavigationTracker';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.addAccountModal>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-add-account-modal-title'),
  }),
});

export const navigationRef = createNavigationContainerRef<INavigationParams>();

export default function AuthAddAccountModalScreen(props: AuthAddAccountModalScreenPrivateProps) {
  const RootStack = getTypedRootStack();
  const authNavigation = useAuthNavigation();
  const routes = React.useMemo(() => authNavigation, [authNavigation]);
  const pending = useSelector(state => getState(state).pendingAddAccount);
  const navigationState = React.useMemo(() => getAddAccountNavigationState(pending), [pending]);
  const trackNavState = useNavigationTracker();
  const dispatch = useDispatch();
  const manageNavSnow = useNavigationSnowHandler(dispatch);
  useConstructor(() => {
    dispatch(actions.addAccountInit());
  });
  React.useLayoutEffect(() => {
    // useLayoutEffect is used to prevent to have a one-frame flash showing the old navigation state
    if (navigationState && navigationRef.isReady()) {
      console.debug('[Navigation] Reset addAccount navigator state', navigationRef.isReady(), JSON.stringify(navigationState));
      navigationRef.reset(navigationState);
    }
    trackNavState(navigationState);
  }, [navigationState, trackNavState]);
  const onStateChange = React.useCallback(
    (state: NavigationState | undefined) => {
      trackNavState(state);
      manageNavSnow();
    },
    [manageNavSnow, trackNavState],
  );
  const navigator = React.useMemo(
    () => (
      <PageView>
        <NavigationContainer independent ref={navigationRef} initialState={navigationState} onStateChange={onStateChange}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>{routes}</RootStack.Navigator>
        </NavigationContainer>
      </PageView>
    ),
    [navigationState, onStateChange, RootStack, routes],
  );
  return navigator;
}
