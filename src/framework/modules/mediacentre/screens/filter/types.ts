import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { ResourceFilter } from '~/framework/modules/mediacentre/model';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';

export interface MediacentreFilterScreenDispatchProps {}

export interface MediacentreFilterScreenNavParams {
  filters: ResourceFilter[];
  title: string;
  onChange: (filters: ResourceFilter[]) => void;
}

export interface MediacentreFilterScreenProps {}

export interface MediacentreFilterScreenStoreProps {
  session?: AuthActiveAccount;
}

export interface MediacentreFilterScreenPrivateProps
  extends NativeStackScreenProps<MediacentreNavigationParams, typeof mediacentreRouteNames.filter>,
    MediacentreFilterScreenProps,
    MediacentreFilterScreenStoreProps,
    MediacentreFilterScreenDispatchProps {}
