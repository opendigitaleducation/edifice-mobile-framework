import * as React from 'react';
import { View } from 'react-native';

import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { ScrapbookHomeScreenDataProps, ScrapbookHomeScreenEventProps, ScrapbookHomeScreenProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import ResourceExplorer from '~/framework/components/explorer/resource-explorer';
import { PageView } from '~/framework/components/page';
import { SvgProps } from '~/framework/components/picture';
import { ContentLoader } from '~/framework/hooks/loader';
import { getSession } from '~/framework/modules/auth/reducer';
import BlogPlaceholderExplorer from '~/framework/modules/blog/components/placeholder/explorer';
import { ScrapbookItem } from '~/framework/modules/scrapbook/model';
import moduleConfig from '~/framework/modules/scrapbook/module-config';
import { ScrapbookNavigationParams, scrapbookRouteNames } from '~/framework/modules/scrapbook/navigation';
import { scrapbookService } from '~/framework/modules/scrapbook/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { formatSource } from '~/framework/util/media';
import { isEmpty } from '~/framework/util/object';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ScrapbookNavigationParams, typeof scrapbookRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('scrapbook-appname'),
  }),
});

const ScrapbookHomeScreen = (props: ScrapbookHomeScreenProps) => {
  const [scrapbooks, setScrapbooks] = React.useState<ScrapbookItem[]>([]);
  const headerHeight = useHeaderHeight();
  const init = async () => {
    const data = await scrapbookService.list();
    setScrapbooks(data);
  };

  const onOpenScrapbook = item => {
    props.navigation.navigate(scrapbookRouteNames.details, {
      headerHeight,
      resourceUri: `/scrapbook#/view-scrapbook/${item.id}`,
    });
  };

  const renderEmpty = () => <EmptyContentScreen />;

  const renderLoading = () => <BlogPlaceholderExplorer />;

  const renderExplorer = () => {
    if (isEmpty(scrapbooks))
      return (
        <EmptyScreen
          svgImage="empty-hammock"
          title={I18n.get('scrapbook-emptyscreen-title')}
          text={I18n.get('scrapbook-emptyscreen-text')}
        />
      );
    const explorerScrapbooks = scrapbooks.map(sb => {
      const { thumbnail, ...b } = sb;
      return {
        ...b,
        color: (moduleConfig.displayPicture as SvgProps).fill ?? theme.palette.complementary.indigo.regular,

        icon: 'scrapbook',
        ...(thumbnail && { thumbnail: formatSource(thumbnail) }),
      };
    });

    return (
      <ResourceExplorer
        resources={explorerScrapbooks}
        onItemPress={onOpenScrapbook}
        ListFooterComponent={<View style={{ paddingBottom: UI_SIZES.screen.bottomInset }} />}
        ListEmptyComponent={renderEmpty}
        keyExtractor={item => item.id}
      />
    );
  };

  return (
    <PageView>
      <ContentLoader loadContent={init} renderContent={renderExplorer} renderError={renderEmpty} renderLoading={renderLoading} />
    </PageView>
  );
};

const mapStateToProps: (s: IGlobalState) => ScrapbookHomeScreenDataProps = s => ({
  session: getSession(),
});

const mapDispatchToProps: (
  dispatch: ThunkDispatch<any, any, any>,
  getState: () => IGlobalState,
) => ScrapbookHomeScreenEventProps = (dispatch, getState) => ({});

const ScrapbookHomeScreenConnected = connect(mapStateToProps, mapDispatchToProps)(ScrapbookHomeScreen);
export default ScrapbookHomeScreenConnected;
