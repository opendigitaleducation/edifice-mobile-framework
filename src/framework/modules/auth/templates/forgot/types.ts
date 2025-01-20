import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { forgotAction } from '~/framework/modules/auth/actions';
import { ForgotMode } from '~/framework/modules/auth/model';
import { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { Platform } from '~/framework/util/appConf';

export interface ForgotScreenProps {}

export type ForgotScreenStructure = {
  structureId: string;
  structureName: string;
};

export type ForgotScreenLoadingState = 'IDLE' | 'RUNNING' | 'DONE';

export interface ForgotScreenEventProps {
  trySubmit: (...args: Parameters<typeof forgotAction>) => ReturnType<ReturnType<typeof forgotAction>>;
}

export type ForgotScreenPrivateProps = ForgotScreenProps &
  ForgotScreenEventProps &
  NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.forgot | typeof authRouteNames.addAccountForgot>;

export interface ForgotScreenNavParams {
  platform: Platform;
  mode: ForgotMode;
  login?: string;
}
