import I18n from 'i18n-js';
import * as React from 'react';
import Toast from 'react-native-tiny-toast';
import { withNavigationFocus } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PageView } from '~/framework/components/page';
import { getUserSession } from '~/framework/util/session';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { fetchExternalsAction } from '~/modules/mediacentre/actions/externals';
import { addFavoriteAction, fetchFavoritesAction, removeFavoriteAction } from '~/modules/mediacentre/actions/favorites';
import { searchResourcesAction, searchResourcesAdvancedAction } from '~/modules/mediacentre/actions/search';
import { fetchSignetsAction } from '~/modules/mediacentre/actions/signets';
import { fetchTextbooksAction } from '~/modules/mediacentre/actions/textbooks';
import { AdvancedSearchParams } from '~/modules/mediacentre/components/AdvancedSearchModal';
import { getExternalsState } from '~/modules/mediacentre/state/externals';
import { getFavoritesState } from '~/modules/mediacentre/state/favorites';
import { getSearchState } from '~/modules/mediacentre/state/search';
import { ISignets, getSignetsState } from '~/modules/mediacentre/state/signets';
import { getTextbooksState } from '~/modules/mediacentre/state/textbooks';
import { Resource, Source } from '~/modules/mediacentre/utils/Resource';
import ConnectionTrackingBar from '~/ui/ConnectionTrackingBar';
import { PageContainer } from '~/ui/ContainerContent';

import HomePageContainer from './HomePage';

type IDashboardProps = {
  externals: Resource[];
  favorites: Resource[];
  navigation: { navigate };
  search: Resource[];
  signets: ISignets;
  textbooks: Resource[];
  userId: string;

  postAddFavorite: (id: string, resource: Resource) => any;
  fetchExternals: () => any;
  fetchFavorites: () => any;
  fetchSignets: (userId: string) => any;
  fetchTextbooks: () => any;
  postRemoveFavorite: (id: string, source: Source) => any;
  searchResources: (query: string) => any;
  searchResourcesAdvanced: (params: AdvancedSearchParams) => any;
};

export class Dashboard extends React.PureComponent<IDashboardProps> {
  componentDidMount() {
    this.props.fetchExternals();
    this.props.fetchFavorites();
    this.props.fetchTextbooks();
    this.props.fetchSignets(this.props.userId);
  }

  addFavorite = async (resourceId: string, resource: Resource) => {
    try {
      await this.props.postAddFavorite(resourceId, resource);
      Toast.showSuccess(I18n.t('mediacentre.favorite-added'), {
        position: Toast.position.BOTTOM,
        mask: false,
        containerStyle: { width: '95%', backgroundColor: 'black' },
      });
      this.props.fetchFavorites();
    } catch (err) {
      Toast.show(I18n.t('common.error.text'));
    }
  };

  removeFavorite = async (resourceId: string, resource: Source) => {
    try {
      await this.props.postRemoveFavorite(resourceId, resource);
      Toast.showSuccess(I18n.t('mediacentre.favorite-removed'), {
        position: Toast.position.BOTTOM,
        mask: false,
        containerStyle: { width: '95%', backgroundColor: 'black' },
      });
      this.props.fetchFavorites();
    } catch (err) {
      Toast.show(I18n.t('common.error.text'));
    }
  };

  public render() {
    return (
      <PageView
        navigation={this.props.navigation}
        navBarWithBack={{
          title: I18n.t('mediacentre.mediacentre'),
          style: {
            backgroundColor: '#F53B56',
          },
        }}>
        <PageContainer>
          <ConnectionTrackingBar />
          <HomePageContainer {...this.props} {...this.state} addFavorite={this.addFavorite} removeFavorite={this.removeFavorite} />
        </PageContainer>
      </PageView>
    );
  }
}

const setFavorites = (resources: Resource[], favorites: string[]) => {
  for (const resource of resources) {
    resource.favorite = favorites.includes(String(resource.id));
  }
};

const mapStateToProps: (state: any) => any = state => {
  const externals = getExternalsState(state).data;
  const favorites = getFavoritesState(state).data;
  const search = getSearchState(state).data;
  const signets = getSignetsState(state).data;
  const textbooks = getTextbooksState(state).data;
  const userId = getUserSession().user.id;

  const favIds = favorites.map(favorite => String(favorite.id));
  setFavorites(externals, favIds);
  setFavorites(search, favIds);
  setFavorites(signets.orientationSignets, favIds);
  setFavorites(signets.sharedSignets, favIds);
  setFavorites(textbooks, favIds);

  return {
    externals,
    favorites,
    search,
    signets,
    textbooks,
    userId,
  };
};

const mapDispatchToProps: (dispatch: any) => any = dispatch => {
  return bindActionCreators(
    {
      postAddFavorite: addFavoriteAction,
      fetchFavorites: fetchFavoritesAction,
      fetchExternals: fetchExternalsAction,
      fetchSignets: fetchSignetsAction,
      fetchTextbooks: fetchTextbooksAction,
      postRemoveFavorite: removeFavoriteAction,
      searchResources: searchResourcesAction,
      searchResourcesAdvanced: searchResourcesAdvancedAction,
    },
    dispatch,
  );
};

export default withViewTracking('mediacentre')(connect(mapStateToProps, mapDispatchToProps)(withNavigationFocus(Dashboard)));
