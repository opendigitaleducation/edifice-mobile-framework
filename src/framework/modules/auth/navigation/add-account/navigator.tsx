/**
 * Navigator for the auth section
 */
import * as React from 'react';

import { I18n } from '~/app/i18n';
import AuthActivationAddAccountScreen, {
  computeNavBar as authActivationAddAccountNavBar,
} from '~/framework/modules/auth/screens/add-account/activation';
import AuthChangePasswordScreen, {
  computeNavBar as changePasswordNavBar,
} from '~/framework/modules/auth/screens/add-account/change-password';
import AuthForgotAddAccountScreen from '~/framework/modules/auth/screens/add-account/forgot';
import AuthLoginCredentialsScreen, {
  computeNavBar as loginCredentialsNavBar,
} from '~/framework/modules/auth/screens/add-account/login-credentials';
import AuthLoginWayfAddAccountScreen, {
  computeNavBar as loginWayfNavBar,
} from '~/framework/modules/auth/screens/add-account/login-wayf';
import AuthOnboardingScreen, { computeNavBar as onboardingNavBar } from '~/framework/modules/auth/screens/add-account/onboarding';
import AuthPlatformsAddAccountScreen, {
  computeNavBar as platformsAddAccountNavBar,
} from '~/framework/modules/auth/screens/add-account/platforms';
import AuthWayfAddAccountScreen, { computeNavBar as wayfNavBar } from '~/framework/modules/auth/screens/add-account/wayf';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { getTypedRootStack } from '~/framework/navigation/navigators';

import { AuthNavigationParams, authRouteNames } from '..';

const Stack = getTypedRootStack<AuthNavigationParams>();

// Auth Stack used when user is logged in, adding another account.

export default function () {
  return (
    <Stack.Group screenOptions={navBarOptions}>
      <Stack.Screen
        name={authRouteNames.addAccountOnboarding as typeof authRouteNames.onboarding}
        component={AuthOnboardingScreen}
        options={onboardingNavBar}
      />
      <Stack.Screen
        name={authRouteNames.addAccountPlatforms as typeof authRouteNames.platforms}
        component={AuthPlatformsAddAccountScreen}
        options={platformsAddAccountNavBar}
      />
      <Stack.Screen
        name={authRouteNames.addAccountLoginCredentials as typeof authRouteNames.loginCredentials}
        component={AuthLoginCredentialsScreen}
        options={loginCredentialsNavBar}
      />

      <Stack.Screen name={authRouteNames.addAccountLoginWayf} component={AuthLoginWayfAddAccountScreen} options={loginWayfNavBar} />
      <Stack.Screen name={authRouteNames.addAccountWayf} component={AuthWayfAddAccountScreen} options={wayfNavBar} />
      <Stack.Screen
        name={authRouteNames.addAccountChangePassword}
        component={AuthChangePasswordScreen}
        options={changePasswordNavBar}
      />
      <Stack.Screen
        name={authRouteNames.addAccountActivation}
        component={AuthActivationAddAccountScreen}
        options={authActivationAddAccountNavBar}
      />
      <Stack.Screen
        name={authRouteNames.addAccountForgot}
        component={AuthForgotAddAccountScreen}
        options={({ route }) => ({
          headerTitle: navBarTitle(
            route.params.mode === 'id' ? I18n.get('auth-navigation-forgot-id') : I18n.get('auth-navigation-forgot-password'),
          ),
        })}
      />
    </Stack.Group>
  );
}
