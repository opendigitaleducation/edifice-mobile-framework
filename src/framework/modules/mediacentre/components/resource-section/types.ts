import { Resource, SectionType } from '~/framework/modules/mediacentre/model';

export type ResourceSectionProps = {
  resources: Resource[];
  type: SectionType;
  disableShowAll?: boolean;
  iconName?: string;
  isResourceFavorite: (uid: string) => boolean;
  onAddFavorite: (resource: Resource) => void;
  onRemoveFavorite: (resource: Resource) => void;
  openResourceList: (resources: Resource[], section: SectionType) => void;
};
