import React from 'react';
import { View } from 'react-native';

import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationState, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import styles from './styles';
import { AudienceReactionsScreenProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { BadgeAvatar, BadgePosition } from '~/framework/components/badgeAvatar';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen, EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { BodyText, CaptionBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { audienceService } from '~/framework/modules/audience/service';
import { AudienceReactions, AudienceUserReaction } from '~/framework/modules/audience/types';
import { getValidReactionTypes } from '~/framework/modules/auth/reducer';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import { accountTypeInfos } from '~/framework/util/accountType';
import { isEmpty } from '~/framework/util/object';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IModalsNavigationParams, typeof ModalsRouteNames.AudienceReactions>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('audience-reactions-title'),
  }),
});

const renderTabReaction = (key, nb, focused) => {
  const TextComponent = focused ? SmallBoldText : SmallText;
  if (key === 'all')
    return <TextComponent style={focused ? styles.headerItemTextFocused : {}}>{I18n.get('audience-reactions-all')} </TextComponent>;
  return (
    <View style={styles.headerItem}>
      <Svg name={key.toLowerCase()} />
      <TextComponent style={focused ? styles.headerItemTextFocused : {}}>{nb}</TextComponent>
    </View>
  );
};

const PAGE_SIZE = 20;

const AudienceReactionsScreen = (props: AudienceReactionsScreenProps) => {
  const { module, resourceId, resourceType } = props.route.params.referer;

  const [userReactions, setUserReactions] = React.useState<AudienceUserReaction[]>([]);
  const [index, setIndex] = React.useState(0);
  const reactionRoutes = props.validReactionTypes.map(reactionType => ({
    key: reactionType,
  }));
  const routes = [{ key: 'all' }, ...reactionRoutes];
  const [countByType, setCountByType] = React.useState<Record<string, number>>({});
  const [nextPageToFetchState, setNextPageToFetch] = React.useState(1);
  const [loadingState, setLoadingState] = React.useState(AsyncPagedLoadingState.PRISTINE);

  const listFooterComponent = React.useMemo(
    () => (
      <>
        {loadingState === AsyncPagedLoadingState.FETCH_NEXT ? <LoadingIndicator withVerticalMargins /> : null}
        <View style={{ paddingBottom: UI_SIZES.screen.bottomInset }} />
      </>
    ),
    [loadingState],
  );

  const loadData = React.useCallback(async () => {
    if (nextPageToFetchState < 0) return;
    try {
      const dt = (await audienceService.reaction.getDetails(
        {
          module,
          resourceId,
          resourceType,
        },
        nextPageToFetchState,
        PAGE_SIZE,
      )) as AudienceReactions;
      setNextPageToFetch(dt.userReactions.length === 0 ? -1 : nextPageToFetchState + 1);
      setUserReactions([...userReactions, ...dt.userReactions]);
      if (isEmpty(countByType)) setCountByType(dt.reactionCounters.countByType);
    } catch (e) {
      console.error('[AudienceReactionsScreen] error :', e);
      throw new Error();
    }
  }, [countByType, module, nextPageToFetchState, resourceId, resourceType, userReactions]);

  const fetchNextPage = () => {
    if (loadingState === AsyncPagedLoadingState.FETCH_NEXT) return;
    setLoadingState(AsyncPagedLoadingState.FETCH_NEXT);
    loadData()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.FETCH_NEXT_FAILED));
  };

  const renderScene = ({ route }) => {
    const data = route.key === 'all' ? userReactions : userReactions.filter(reaction => reaction.reactionType === route.key);
    return (
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <BadgeAvatar
              userId={item.userId}
              badgeContent={{ name: `${item.reactionType.toLowerCase()}-round`, type: 'Svg' }}
              badgePosition={BadgePosition.bottom}
            />
            <View>
              <BodyText>{item.displayName}</BodyText>
              <CaptionBoldText>{accountTypeInfos[item.profile].text}</CaptionBoldText>
            </View>
          </View>
        )}
        bounces={!isEmpty(data)}
        ListEmptyComponent={
          <EmptyScreen
            svgImage="empty-timeline"
            title={I18n.get('audience-reactions-empty')}
            customTitleStyle={styles.noReactionTitle}
            customStyle={styles.noReactionView}
          />
        }
        contentContainerStyle={styles.flatlist}
        ListFooterComponent={listFooterComponent}
        onEndReached={() => {
          if (userReactions.length >= (nextPageToFetchState - 1) * PAGE_SIZE) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
      />
    );
  };
  const renderTabBar = (
    tabBarProps: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string; icon: string }> },
  ) => {
    return (
      <TabBar
        renderLabel={({ focused, route }) => renderTabReaction(route.key, countByType![route.key] ?? 0, focused)}
        indicatorStyle={styles.tabBarIndicatorContainer}
        style={styles.tabBarContainer}
        {...tabBarProps}
      />
    );
  };
  const renderContent = () => {
    return (
      <PageView style={styles.container} showNetworkBar={false}>
        <TabView
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
        />
      </PageView>
    );
  };
  return <ContentLoader loadContent={loadData} renderContent={renderContent} renderError={() => <EmptyConnectionScreen />} />;
};

export default connect(
  state => {
    return {
      validReactionTypes: getValidReactionTypes(),
    };
  },
  (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => () => ({
    dispatch,
  }),
)(AudienceReactionsScreen);
