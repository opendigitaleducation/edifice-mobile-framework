import React from 'react';
import { View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { NamedSVG } from '~/framework/components/picture';
import { ResourceFilter } from '~/framework/modules/mediacentre/model';

import FilterButton from './filter-button';
import styles from './styles';
import { ResourceFilterListProps } from './types';

const ResourceFilterList: React.FunctionComponent<ResourceFilterListProps> = ({
  filters,
  showThemeFilters = true,
  onChange,
  openFilter,
}) => {
  const hasFilter = Object.values(filters).some(v => v.length >= 2);

  const handleChangeSources = (sources: ResourceFilter[]) => onChange({ ...filters, sources });

  const handleChangeTypes = (types: ResourceFilter[]) => onChange({ ...filters, types });

  const handleChangeThemes = (themes: ResourceFilter[]) => onChange({ ...filters, themes });

  const handleChangeLevels = (levels: ResourceFilter[]) => onChange({ ...filters, levels });

  const handleChangeDisciplines = (disciplines: ResourceFilter[]) => onChange({ ...filters, disciplines });

  return (
    <View style={styles.mainContainer}>
      {hasFilter ? <NamedSVG name="ui-filter" width={20} height={20} fill={theme.ui.text.regular} /> : null}
      {filters.sources.length > 1 ? (
        <FilterButton
          text={I18n.get('mediacentre-resourcelist-filter-sources')}
          action={() =>
            openFilter({
              title: I18n.get('mediacentre-resourcelist-filter-sources'),
              filters: filters.sources,
              onChange: handleChangeSources,
            })
          }
        />
      ) : null}
      {filters.types.length > 1 ? (
        <FilterButton
          text={I18n.get('mediacentre-resourcelist-filter-types')}
          action={() =>
            openFilter({
              title: I18n.get('mediacentre-resourcelist-filter-types'),
              filters: filters.types,
              onChange: handleChangeTypes,
            })
          }
        />
      ) : null}
      {filters.themes.length > 1 && showThemeFilters ? (
        <FilterButton
          text={I18n.get('mediacentre-resourcelist-filter-themes')}
          action={() =>
            openFilter({
              title: I18n.get('mediacentre-resourcelist-filter-themes'),
              filters: filters.themes,
              onChange: handleChangeThemes,
            })
          }
        />
      ) : null}
      {filters.levels.length > 1 ? (
        <FilterButton
          text={I18n.get('mediacentre-resourcelist-filter-levels')}
          action={() =>
            openFilter({
              title: I18n.get('mediacentre-resourcelist-filter-levels'),
              filters: filters.levels,
              onChange: handleChangeLevels,
            })
          }
        />
      ) : null}
      {filters.disciplines.length > 1 ? (
        <FilterButton
          text={I18n.get('mediacentre-resourcelist-filter-disciplines')}
          action={() =>
            openFilter({
              title: I18n.get('mediacentre-resourcelist-filter-disciplines'),
              filters: filters.disciplines,
              onChange: handleChangeDisciplines,
            })
          }
        />
      ) : null}
    </View>
  );
};

export default ResourceFilterList;
