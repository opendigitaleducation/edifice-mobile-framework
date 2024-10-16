import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { UserNavigationParams } from '~/framework/modules/user/navigation';

export interface LogData {
  time?: string;
  severity?: string;
  message?: string;
}

export interface MenuData {
  title: string;
  action: () => void;
}

export interface LogScreenProps {}

export interface LogScreenStoreProps {}

export interface LogScreenDispatchProps {}

export interface LogScreenNavParams {}

export interface LogScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'log'>,
    LogScreenProps,
    LogScreenStoreProps,
    LogScreenDispatchProps {}
