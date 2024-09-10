import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';

import { I18n } from '~/app/i18n';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import LoginRedirectPage from '~/framework/modules/auth/templates/login-redirect';
import { navBarOptions } from '~/framework/navigation/navBar';

import type { AuthLoginRedirectAddAccountScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.addAccountLoginRedirect>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('auth-wayf-main-title'),
  }),
});

function AuthLoginRedirectAddAccountScreen(props: AuthLoginRedirectAddAccountScreenPrivateProps) {
  return <LoginRedirectPage {...props} />;
}

export default AuthLoginRedirectAddAccountScreen;
