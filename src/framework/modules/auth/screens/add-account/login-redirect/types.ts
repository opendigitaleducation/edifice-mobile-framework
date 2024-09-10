import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { Platform } from '~/framework/util/appConf';

export interface AuthLoginRedirectAddAccountScreenNavParams {
  platform: Platform;
}

export interface AuthLoginRedirectAddAccountScreenProps {}

export interface AuthLoginRedirectAddAccountScreenPrivateProps
  extends NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.addAccountLoginRedirect>,
    AuthLoginRedirectAddAccountScreenProps {}
