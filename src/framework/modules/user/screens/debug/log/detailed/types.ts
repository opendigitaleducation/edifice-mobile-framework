import { RouteProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { UserNavigationParams } from '~/framework/modules/user/navigation';
import { LogData } from '~/framework/modules/user/screens/debug/log/types';

export interface DetailedScreenProps {}

export interface DetailedScreenStoreProps {}

export interface DetailedScreenDispatchProps {}

export interface DetailedScreenNavParams {
  route?: RouteProp<UserNavigationParams, 'detailed'>;
  logData?: LogData;
}

export interface DetailedScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'detailed'>,
    DetailedScreenProps,
    DetailedScreenStoreProps,
    DetailedScreenDispatchProps {}
