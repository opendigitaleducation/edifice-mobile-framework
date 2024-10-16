import { ResourceFilters } from '~/framework/modules/mediacentre/model';
import { MediacentreFilterScreenNavParams } from '~/framework/modules/mediacentre/screens/filter';

export type ResourceFilterListProps = {
  filters: ResourceFilters;
  showThemeFilters?: boolean;
  onChange: (filters: ResourceFilters) => void;
  openFilter: (params: MediacentreFilterScreenNavParams) => void;
};
