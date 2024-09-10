import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';

export interface LoginRedirectScreenProps {}
export interface LoginRedirectScreenPrivateProps
  extends NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.loginRedirect>,
    LoginRedirectScreenProps {}
