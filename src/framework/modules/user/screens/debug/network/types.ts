import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { UserNavigationParams } from '~/framework/modules/user/navigation';

export interface NetworkScreenProps {}

export interface NetworkScreenStoreProps {}

export interface NetworkScreenDispatchProps {}

export interface NetworkScreenNavParams {}

export interface NetworkScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'network'>,
    NetworkScreenProps,
    NetworkScreenStoreProps,
    NetworkScreenDispatchProps {}
