import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { Platform } from '~/framework/util/appConf';

export interface AuthLoginRedirectScreenNavParams {
  platform: Platform;
}

export interface AuthLoginRedirectScreenProps {}

export interface AuthLoginRedirectScreenPrivateProps
  extends NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.loginRedirect>,
    AuthLoginRedirectScreenProps {}
