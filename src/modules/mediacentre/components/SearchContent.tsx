import I18n from 'i18n-js';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import { LoadingIndicator } from '~/framework/components/loading';
import { Icon } from '~/framework/components/picture/Icon';
import { Small, SmallBold } from '~/framework/components/text';
import { IResource, Source } from '~/modules/mediacentre/reducer';
import { DialogButtonOk } from '~/ui/ConfirmDialog';

import { IField, ISources } from './AdvancedSearchModal';
import { BigCard } from './BigCard';
import { SearchFilter } from './SearchFilter';

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: 'row',
    marginRight: UI_SIZES.spacing.small,
  },
  fieldValueText: {
    marginLeft: UI_SIZES.spacing.tiny,
  },
  parametersContainer: {
    marginHorizontal: UI_SIZES.spacing.medium,
    marginBottom: UI_SIZES.spacing.small,
  },
  upperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourcesContainer: {
    flexDirection: 'row',
  },
  sourceImage: {
    width: 24,
    height: 24,
    marginRight: UI_SIZES.spacing.small,
  },
  cancelButton: {
    backgroundColor: theme.palette.primary.regular,
  },
  fieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: UI_SIZES.spacing.tiny,
  },
  mainContainer: {
    flex: 1,
  },
  loadingIndicator: {
    marginTop: '45%',
  },
  filterContainer: {
    marginHorizontal: UI_SIZES.spacing.medium,
    marginBottom: UI_SIZES.spacing.small,
  },
});

export enum SearchState {
  NONE = 0,
  SIMPLE = 1,
  ADVANCED = 2,
}

interface ISearchFilters {
  level: string[];
  'resource-type': string[];
  source: string[];
}

interface IAdvancedSearchFieldProps {
  field: IField;
}

interface ISearchParamsProps {
  fields: IField[];
  searchState: SearchState;
  sources: ISources;

  onCancelSearch: () => void;
}

interface ISearchContentProps {
  fields: IField[];
  isFetching: boolean;
  resources: IResource[];
  searchState: SearchState;

  addFavorite: (id: string, resource: IResource) => any;
  onCancelSearch: () => void;
  removeFavorite: (id: string, source: Source) => any;
}

const resourceMatchesFilters = (resource: IResource, filters: ISearchFilters) => {
  let typeMatches = filters['resource-type'].length === 0;
  let sourceMatches = filters.source.length === 0;
  let levelMatches = filters.level.length === 0;

  for (const type of filters['resource-type']) {
    if (resource.types.includes(type)) {
      typeMatches = true;
    }
  }
  if (filters.source.includes(resource.source.substring(30))) {
    sourceMatches = true;
  }
  for (const level of filters.level) {
    if (resource.levels.includes(level)) {
      levelMatches = true;
    }
  }
  return typeMatches && sourceMatches && levelMatches;
};

const getSources = (resources: IResource[]) => {
  return {
    GAR: resources.some(resource => resource.source === Source.GAR),
    Moodle: resources.some(resource => resource.source === Source.MOODLE),
    PMB: resources.some(resource => resource.source === Source.PMB),
    Signet: resources.some(resource => resource.source === Source.SIGNET),
  };
};

const AdvancedSearchField: React.FunctionComponent<IAdvancedSearchFieldProps> = (props: IAdvancedSearchFieldProps) =>
  props.field.value !== '' ? (
    <View style={styles.fieldContainer}>
      <SmallBold>{I18n.t(`mediacentre.advancedSearch.${props.field.name}`)}</SmallBold>
      <Small style={styles.fieldValueText}>{props.field.value}</Small>
    </View>
  ) : null;

const SearchParams: React.FunctionComponent<ISearchParamsProps> = (props: ISearchParamsProps) => (
  <View style={styles.parametersContainer}>
    <View style={styles.upperContainer}>
      <View style={styles.sourcesContainer}>
        {props.sources.GAR ? <Image source={require('ASSETS/images/logo-gar.png')} style={styles.sourceImage} /> : null}
        {props.sources.Moodle ? <Image source={require('ASSETS/images/logo-moodle.png')} style={styles.sourceImage} /> : null}
        {props.sources.PMB ? <Image source={require('ASSETS/images/logo-pmb.png')} style={styles.sourceImage} /> : null}
        {props.sources.Signet ? <Icon name="bookmark_outline" size={24} /> : null}
      </View>
      <DialogButtonOk style={styles.cancelButton} label={I18n.t('common.cancel')} onPress={props.onCancelSearch} />
    </View>
    {props.searchState === SearchState.ADVANCED ? (
      <View style={styles.fieldsContainer}>
        {props.fields.map((field, index) => (
          <AdvancedSearchField field={field} key={index} />
        ))}
      </View>
    ) : null}
  </View>
);

export const SearchContent: React.FunctionComponent<ISearchContentProps> = (props: ISearchContentProps) => {
  const [filteredResources, setFilteredResources] = useState<IResource[]>([]);
  const [activeFilters, setActiveFilters] = useState<ISearchFilters>({ 'resource-type': [], source: [], level: [] });
  const isFiltering =
    activeFilters['resource-type'].length > 0 || activeFilters.source.length > 0 || activeFilters.level.length > 0;
  const sources = getSources(isFiltering ? filteredResources : props.resources);
  const filterResources = () => {
    const filtered: IResource[] = [];
    for (const resource of props.resources) {
      if (resourceMatchesFilters(resource, activeFilters)) {
        filtered.push(resource);
      }
    }
    setFilteredResources(filtered);
  };
  const onChange = (title: string, item: string, active: boolean) => {
    const index = activeFilters[title].indexOf(item);
    if (active) {
      activeFilters[title].push(item);
    } else if (index !== -1) {
      activeFilters[title].splice(index, 1);
    }
    setActiveFilters(activeFilters);
    filterResources();
  };
  return (
    <View style={styles.mainContainer}>
      <SearchParams {...props} sources={sources} />
      {props.isFetching ? (
        <LoadingIndicator customStyle={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={isFiltering ? filteredResources : props.resources}
          renderItem={({ item }) => <BigCard {...props} resource={item} key={item.uid || item.id} />}
          keyExtractor={item => item.uid || item.id}
          ListHeaderComponent={
            props.resources.length ? (
              <SearchFilter resources={props.resources} onChange={onChange} containerStyle={styles.filterContainer} />
            ) : null
          }
          ListEmptyComponent={<EmptyScreen svgImage="empty-search" title={I18n.t('mediacentre.empty-search')} />}
        />
      )}
    </View>
  );
};
