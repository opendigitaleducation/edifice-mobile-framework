import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthActiveAccount, UserStructureWithClasses } from '~/framework/modules/auth/model';
import {
  addFavoriteAction,
  editSelectedStructureAction,
  fetchFavoritesAction,
  fetchResourcesAction,
  fetchSelectedStructureAction,
  removeFavoriteAction,
  searchResourcesAction,
} from '~/framework/modules/mediacentre/actions';
import { ResourceSectionProps } from '~/framework/modules/mediacentre/components/resource-section/types';
import { MediacentreResources, Resource } from '~/framework/modules/mediacentre/model';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';

export type Section = Pick<ResourceSectionProps, 'resources' | 'type' | 'iconName'>;

export interface MediacentreHomeScreenDispatchProps {
  tryAddFavorite: (...args: Parameters<typeof addFavoriteAction>) => Promise<void>;
  tryFetchFavorites: (...args: Parameters<typeof fetchFavoritesAction>) => Promise<Resource[]>;
  tryFetchResources: (...args: Parameters<typeof fetchResourcesAction>) => Promise<MediacentreResources>;
  tryFetchSelectedStructure: (...args: Parameters<typeof fetchSelectedStructureAction>) => Promise<string | null>;
  tryRemoveFavorite: (...args: Parameters<typeof removeFavoriteAction>) => Promise<void>;
  trySearchResources: (...args: Parameters<typeof searchResourcesAction>) => Promise<Resource[]>;
  trySelectStructure: (...args: Parameters<typeof editSelectedStructureAction>) => Promise<void>;
}

export interface MediacentreHomeScreenNavParams {}

export interface MediacentreHomeScreenProps {}

export interface MediacentreHomeScreenStoreProps {
  favoriteUids: string[];
  sections: Section[];
  selectedStructure: string | null;
  structures: UserStructureWithClasses[];
  session?: AuthActiveAccount;
}

export interface MediacentreHomeScreenPrivateProps
  extends NativeStackScreenProps<MediacentreNavigationParams, typeof mediacentreRouteNames.home>,
    MediacentreHomeScreenProps,
    MediacentreHomeScreenStoreProps,
    MediacentreHomeScreenDispatchProps {}
