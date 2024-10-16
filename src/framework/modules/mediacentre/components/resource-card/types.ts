import { Resource } from '~/framework/modules/mediacentre/model';

export type ResourceCardProps = {
  isFavorite: boolean;
  resource: Resource;
  variant?: 'default' | 'pin' | 'preview';
  onAddFavorite: () => any;
  onRemoveFavorite: () => any;
};
