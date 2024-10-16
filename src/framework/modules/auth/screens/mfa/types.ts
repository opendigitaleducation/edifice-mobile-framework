import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { refreshRequirementsAction } from '~/framework/modules/auth/actions';
import { AuthActiveAccount, UpdatableUserInfo } from '~/framework/modules/auth/model';
import type { AuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { ModificationType } from '~/framework/modules/user/screens/home/types';
import { Platform } from '~/framework/util/appConf';

export interface AuthMFAScreenDispatchProps {
  tryRefreshRequirements: (
    ...args: Parameters<typeof refreshRequirementsAction>
  ) => ReturnType<ReturnType<typeof refreshRequirementsAction>>;
  tryUpdateProfile: (updatedProfileValues: Partial<UpdatableUserInfo>) => Promise<void>;
}

export interface AuthMFAScreenNavParams {
  email?: string;
  isEmailMFA?: boolean;
  isMobileMFA?: boolean;
  mfaRedirectionRoute?: string;
  mobile?: string;
  modificationType?: ModificationType;
  navBarTitle: string;
  platform: Platform;
  rememberMe?: boolean;
}

export interface AuthMFAScreenProps {}

export interface AuthMFAScreenStoreProps {
  session?: AuthActiveAccount;
}

export interface AuthMFAScreenPrivateProps
  extends NativeStackScreenProps<AuthNavigationParams, typeof authRouteNames.mfa | typeof authRouteNames.mfaModal>,
    AuthMFAScreenProps,
    AuthMFAScreenStoreProps,
    AuthMFAScreenDispatchProps {}

export enum CodeState {
  CODE_CORRECT = 'codeCorrect',
  CODE_EXPIRED = 'codeExpired',
  CODE_RESENT = 'codeResent',
  CODE_STATE_UNKNOWN = 'codeStateUnknown',
  CODE_WRONG = 'codeWrong',
  PRISTINE = 'pristine',
}

export interface PageTexts {
  feedback: string;
  message: string;
  messageSent: string;
  resendToast: string;
  title: string;
}

export interface MFATestIds {
  title: string;
  subtitle: string;
  code: string;
  codeError: string;
  codeIssues: string;
  resend: string;
}

export enum ResendResponse {
  FAIL = 'fail',
  SUCCESS = 'success',
}
