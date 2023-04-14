/**
 * Navigator for the auth section
 */
import I18n from 'i18n-js';
import * as React from 'react';

import ActivationScreen from '~/framework/modules/auth/screens/ActivationScreen';
import ForgotScreen from '~/framework/modules/auth/screens/ForgotScreen';
import LoginWayfScreen from '~/framework/modules/auth/screens/LoginWayfScreen';
import PlatformSelectScreen from '~/framework/modules/auth/screens/PlatformSelectScreen';
import RevalidateTermsScreen from '~/framework/modules/auth/screens/RevalidateTermsScreen';
import WayfScreen from '~/framework/modules/auth/screens/WayfScreen';
import AuthChangeEmailScreen, { computeNavBar as authChangeEmailNavBar } from '~/framework/modules/auth/screens/change-email';
import AuthChangeMobileScreen, { computeNavBar as authChangeMobileNavBar } from '~/framework/modules/auth/screens/change-mobile';
import ChangePasswordScreen from '~/framework/modules/auth/screens/change-password';
import LoginHomeScreen from '~/framework/modules/auth/screens/login-home';
import AuthMFAScreen, { computeNavBar as mfaNavBar } from '~/framework/modules/auth/screens/mfa';
import OnboardingScreen from '~/framework/modules/auth/screens/onboarding';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { getTypedRootStack } from '~/framework/navigation/navigators';

import { AuthRouteNames, IAuthNavigationParams } from '.';

const Stack = getTypedRootStack<IAuthNavigationParams>();

export default function () {
  return (
    <Stack.Group screenOptions={navBarOptions}>
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name={AuthRouteNames.onboarding} component={OnboardingScreen} />
        <Stack.Screen name={AuthRouteNames.platforms} component={PlatformSelectScreen} />
      </Stack.Group>
      <Stack.Screen
        name={AuthRouteNames.loginHome}
        component={LoginHomeScreen}
        options={({ route }) => ({
          headerTitle: navBarTitle(route.params?.platform.displayName),
        })}
      />
      <Stack.Screen
        name={AuthRouteNames.loginWayf}
        component={LoginWayfScreen}
        options={({ route }) => ({
          headerTitle: navBarTitle(route.params?.platform.displayName),
        })}
      />
      <Stack.Screen
        name={AuthRouteNames.wayf}
        component={WayfScreen}
        options={{
          headerTitle: navBarTitle(I18n.t('login-wayf-main-title')),
        }}
      />
      <Stack.Screen
        name={AuthRouteNames.activation}
        component={ActivationScreen}
        options={{
          headerTitle: navBarTitle(I18n.t('activation-title')),
        }}
      />
      <Stack.Screen
        name={AuthRouteNames.forgot}
        component={ForgotScreen}
        options={({ route }) => ({
          headerTitle: navBarTitle(route.params.mode === 'id' ? I18n.t('forgot-id') : I18n.t('forgot-password')),
        })}
      />
      <Stack.Screen
        name={AuthRouteNames.revalidateTerms}
        component={RevalidateTermsScreen}
        options={{
          headerTitle: navBarTitle(I18n.t('user.revalidateTermsScreen.title')),
        }}
      />
      <Stack.Screen
        name={AuthRouteNames.changePassword}
        component={ChangePasswordScreen}
        options={{
          headerTitle: navBarTitle(I18n.t('user.page.editPassword')),
        }}
      />
      <Stack.Screen
        name={AuthRouteNames.changeEmail}
        component={AuthChangeEmailScreen}
        options={authChangeEmailNavBar}
        initialParams={{}}
      />
      <Stack.Screen
        name={AuthRouteNames.changeMobile}
        component={AuthChangeMobileScreen}
        options={authChangeMobileNavBar}
        initialParams={{}}
      />
      <Stack.Screen name={AuthRouteNames.mfa} component={AuthMFAScreen} options={mfaNavBar} initialParams={{}} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name={AuthRouteNames.mfaModal} component={AuthMFAScreen} options={mfaNavBar} initialParams={{}} />
      </Stack.Group>
    </Stack.Group>
  );
}
