import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { PageView } from '~/framework/components/page';
import DropdownPicker from '~/framework/components/pickers/dropdown';
import SearchBar from '~/framework/components/search-bar';
import Toast from '~/framework/components/toast';
import { ContentLoader } from '~/framework/hooks/loader';
import { getSession } from '~/framework/modules/auth/reducer';
import {
  addFavoriteAction,
  editSelectedStructureAction,
  fetchFavoritesAction,
  fetchResourcesAction,
  fetchSelectedStructureAction,
  removeFavoriteAction,
  searchResourcesAction,
} from '~/framework/modules/mediacentre/actions';
import ResourceSection from '~/framework/modules/mediacentre/components/resource-section';
import { Resource, SectionType } from '~/framework/modules/mediacentre/model';
import moduleConfig from '~/framework/modules/mediacentre/module-config';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';

import styles from './styles';
import { MediacentreHomeScreenDispatchProps, MediacentreHomeScreenPrivateProps, Section } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<MediacentreNavigationParams, typeof mediacentreRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('mediacentre-home-title'),
  }),
});

const MediacentreHomeScreen = (props: MediacentreHomeScreenPrivateProps) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState(props.selectedStructure);
  const [query, setQuery] = useState('');

  const loadResources = async () => {
    try {
      let structureId = await props.tryFetchSelectedStructure();
      if (!structureId) {
        if (!props.structures.length) throw new Error();
        structureId = props.structures[0].id;
        await props.trySelectStructure(structureId);
      }
      setSelectedStructureId(structureId);
      await props.tryFetchFavorites();
      await props.tryFetchResources(structureId);
    } catch {
      throw new Error();
    }
  };

  const handleSelectStructure = async (item: { value?: string }) => {
    try {
      const structureId = item.value;

      if (structureId) {
        await props.trySelectStructure(structureId);
        await props.tryFetchResources(structureId);
      }
    } catch {
      Toast.showError();
    }
  };

  const openResourceList = (resources: Resource[], section: SectionType) =>
    props.navigation.push(mediacentreRouteNames.resourceList, {
      resources,
      section,
    });

  const handleSearch = () => {
    if (query) {
      props.trySearchResources(query);
      props.navigation.push(mediacentreRouteNames.resourceList, {
        query,
        resources: [],
      });
      setQuery('');
    }
  };

  const isResourceFavorite = (uid: string): boolean => props.favoriteUids.includes(uid);

  const handleAddFavorite = async (resource: Resource) => {
    try {
      await props.tryAddFavorite(resource);
      Toast.showSuccess(I18n.get('mediacentre-home-favorite-added'));
    } catch {
      Toast.showError(I18n.get('mediacentre-home-error-text'));
    }
  };

  const handleRemoveFavorite = async (resource: Resource) => {
    try {
      await props.tryRemoveFavorite(resource);
      Toast.showSuccess(I18n.get('mediacentre-home-favorite-removed'));
    } catch {
      Toast.showError(I18n.get('mediacentre-home-error-text'));
    }
  };

  const renderEmpty = () => {
    return <EmptyScreen svgImage="empty-mediacentre" title={I18n.get('mediacentre-home-emptyscreen-default')} />;
  };

  const renderResources = () => {
    return (
      <PageView>
        <FlatList
          data={props.sections}
          renderItem={({ item }: { item: Section }) => (
            <ResourceSection
              {...item}
              disableShowAll={item.type === SectionType.PINS}
              isResourceFavorite={isResourceFavorite}
              onAddFavorite={handleAddFavorite}
              onRemoveFavorite={handleRemoveFavorite}
              openResourceList={openResourceList}
            />
          )}
          keyExtractor={(item: Section) => item.type}
          ListEmptyComponent={renderEmpty()}
          ListHeaderComponent={
            <View style={styles.listHeaderContainer}>
              {props.structures.length > 1 ? (
                <DropdownPicker
                  variant="standard"
                  open={isDropdownOpen}
                  value={selectedStructureId}
                  items={props.structures.map(s => ({ label: s.name.trim(), value: s.id }))}
                  setOpen={setDropdownOpen}
                  setValue={setSelectedStructureId}
                  onSelectItem={handleSelectStructure}
                />
              ) : null}
              <SearchBar
                placeholder={I18n.get('mediacentre-home-searchbar-placeholder')}
                query={query}
                onChangeQuery={setQuery}
                onSearch={handleSearch}
              />
            </View>
          }
          ListHeaderComponentStyle={styles.listHeaderZIndex}
          contentContainerStyle={styles.listContentContainer}
        />
      </PageView>
    );
  };

  return <ContentLoader loadContent={loadResources} renderContent={renderResources} />;
};

export default connect(
  (state: IGlobalState) => {
    const { favorites, resources, selectedStructure } = moduleConfig.getState(state);
    const session = getSession();

    return {
      favoriteUids: favorites.data.map(r => r.uid),
      sections: [
        { type: SectionType.PINS, resources: resources.data.pins, iconName: 'ui-flag' },
        { type: SectionType.FAVORITES, resources: favorites.data, iconName: 'ui-star-filled' },
        { type: SectionType.TEXTBOOKS, resources: resources.data.textbooks, iconName: 'ui-toga' },
        { type: SectionType.EXTERNAL_RESOURCES, resources: resources.data.externals, iconName: 'ui-laptop' },
        { type: SectionType.SIGNETS, resources: resources.data.signets, iconName: 'ui-bookmark' },
      ].filter(section => section.resources.length),
      selectedStructure: selectedStructure.data,
      session,
      structures: session?.user.structures ?? [],
    };
  },
  dispatch =>
    bindActionCreators<MediacentreHomeScreenDispatchProps>(
      {
        tryAddFavorite: tryAction(addFavoriteAction),
        tryFetchFavorites: tryAction(fetchFavoritesAction),
        tryFetchResources: tryAction(fetchResourcesAction),
        tryFetchSelectedStructure: tryAction(fetchSelectedStructureAction),
        tryRemoveFavorite: tryAction(removeFavoriteAction),
        trySearchResources: tryAction(searchResourcesAction),
        trySelectStructure: tryAction(editSelectedStructureAction),
      },
      dispatch,
    ),
)(MediacentreHomeScreen);
