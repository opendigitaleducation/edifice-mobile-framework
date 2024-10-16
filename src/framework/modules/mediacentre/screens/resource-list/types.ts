import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { addFavoriteAction, removeFavoriteAction, searchResourcesAction } from '~/framework/modules/mediacentre/actions';
import { Resource, SectionType } from '~/framework/modules/mediacentre/model';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';

export interface MediacentreResourceListScreenDispatchProps {
  tryAddFavorite: (...args: Parameters<typeof addFavoriteAction>) => Promise<void>;
  tryRemoveFavorite: (...args: Parameters<typeof removeFavoriteAction>) => Promise<void>;
  trySearchResources: (...args: Parameters<typeof searchResourcesAction>) => Promise<Resource[]>;
}

export interface MediacentreResourceListScreenNavParams {
  resources: Resource[];
  query?: string;
  section?: SectionType;
}

export interface MediacentreResourceListScreenProps {}

export interface MediacentreResourceListScreenStoreProps {
  favoriteUids: string[];
  isFetching: boolean;
  search: Resource[];
  session?: AuthActiveAccount;
}

export interface MediacentreResourceListScreenPrivateProps
  extends NativeStackScreenProps<MediacentreNavigationParams, typeof mediacentreRouteNames.resourceList>,
    MediacentreResourceListScreenProps,
    MediacentreResourceListScreenStoreProps,
    MediacentreResourceListScreenDispatchProps {}
