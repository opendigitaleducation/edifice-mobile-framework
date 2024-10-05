import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import SearchBar from '~/framework/components/search-bar';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { addFavoriteAction, removeFavoriteAction, searchResourcesAction } from '~/framework/modules/mediacentre/actions';
import ResourceCard from '~/framework/modules/mediacentre/components/resource-card';
import { Resource } from '~/framework/modules/mediacentre/model';
import moduleConfig from '~/framework/modules/mediacentre/module-config';
import { MediacentreNavigationParams, mediacentreRouteNames } from '~/framework/modules/mediacentre/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';

import styles from './styles';
import { MediacentreResourceListScreenDispatchProps, MediacentreResourceListScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<
  MediacentreNavigationParams,
  typeof mediacentreRouteNames.resourceList
>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: route.params.query ? I18n.get('mediacentre-resourcelist-search') : route.params.title,
  }),
});

const MediacentreResourceListScreen = (props: MediacentreResourceListScreenPrivateProps) => {
  const { params } = props.route;
  const [query, setQuery] = useState(params.query ?? '');
  const [isSearchActive, setSearchActive] = useState<boolean>(!!params.query);

  const handleSearch = () => {
    setSearchActive(true);
    props.trySearchResources(query);
  };

  const handleClearSearch = () => {
    if (!params.query) setSearchActive(false);
  };

  const isResourceFavorite = (uid: string): boolean => props.favoriteUids.includes(uid);

  const handleAddFavorite = async (resource: Resource) => {
    try {
      await props.tryAddFavorite(resource);
      Toast.showSuccess(I18n.get('mediacentre-resourcelist-favorite-added'));
    } catch {
      Toast.showError(I18n.get('mediacentre-resourcelist-error-text'));
    }
  };

  const handleRemoveFavorite = async (resource: Resource) => {
    try {
      await props.tryRemoveFavorite(resource);
      Toast.showSuccess(I18n.get('mediacentre-resourcelist-favorite-removed'));
    } catch {
      Toast.showError(I18n.get('mediacentre-resourcelist-error-text'));
    }
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <ResourceCard
      variant="default"
      resource={item}
      isFavorite={isResourceFavorite(item.uid)}
      onAddFavorite={() => handleAddFavorite(item)}
      onRemoveFavorite={() => handleRemoveFavorite(item)}
    />
  );

  const renderEmpty = () => {
    if (isSearchActive) {
      return props.isFetching ? (
        <LoadingIndicator />
      ) : (
        <EmptyScreen svgImage="empty-search" title={I18n.get('mediacentre-resourcelist-emptyscreen-search')} />
      );
    }
    if (!params.query)
      return <EmptyScreen svgImage="empty-content" title={I18n.get('mediacentre-resourcelist-emptyscreen-default')} />;
    return null;
  };

  const renderList = () => {
    return (
      <FlatList
        data={isSearchActive ? props.search : params.resources}
        renderItem={renderResource}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          <SearchBar
            placeholder={I18n.get('mediacentre-resourcelist-searchbar-placeholder')}
            query={query}
            onChangeQuery={setQuery}
            onClear={handleClearSearch}
            onSearch={handleSearch}
          />
        }
      />
    );
  };

  return <PageView>{renderList()}</PageView>;
};

export default connect(
  (state: IGlobalState) => {
    const mediacentreState = moduleConfig.getState(state);
    const session = getSession();

    return {
      favoriteUids: mediacentreState.favorites.data.map(r => r.uid),
      isFetching: mediacentreState.search.isFetching,
      search: mediacentreState.search.data,
      session,
    };
  },
  dispatch =>
    bindActionCreators<MediacentreResourceListScreenDispatchProps>(
      {
        tryAddFavorite: tryAction(addFavoriteAction),
        tryRemoveFavorite: tryAction(removeFavoriteAction),
        trySearchResources: tryAction(searchResourcesAction),
      },
      dispatch,
    ),
)(MediacentreResourceListScreen);