import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { NavigationState, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { BadgeAvatar, BadgePosition } from '~/framework/components/badgeAvatar';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, CaptionBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { getValidReactionTypes } from '~/framework/modules/auth/reducer';
import { audienceService } from '~/framework/modules/core/audience/service';
import { AudienceReactions, AudienceUserReaction } from '~/framework/modules/core/audience/types';
import { audienceReactionsInfos } from '~/framework/modules/core/audience/util';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import { accountTypeInfos } from '~/framework/util/accountType';

import styles from './styles';
import { AudienceReactionsScreenProps } from './types';

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
      <NamedSVG name={key.toLowerCase()} />
      <TextComponent style={focused ? styles.headerItemTextFocused : {}}>{nb}</TextComponent>
    </View>
  );
};

const AudienceReactionsScreen = (props: AudienceReactionsScreenProps) => {
  const { module, resourceId, resourceType } = props.route.params.referer;

  const [userReactions, setUserReactions] = React.useState<AudienceUserReaction[]>([]);
  const [index, setIndex] = React.useState(0);
  const reactionRoutes = props.validReactionTypes.map(reactionType => ({
    key: reactionType,
  }));
  const routes = [{ key: 'all' }, ...reactionRoutes];
  const [countByType, setCountByType] = React.useState<Record<string, number>>();

  const loadData = React.useCallback(async () => {
    try {
      const dt = (await audienceService.reaction.getDetails(
        {
          module,
          resourceType,
          resourceId,
        },
        1,
        20,
      )) as AudienceReactions;
      setUserReactions(dt.userReactions);
      setCountByType(dt.reactionCounters.countByType);
    } catch (e) {
      console.error('[AudienceReactionsScreen] error :', e);
    }
  }, [module, resourceId, resourceType]);

  const renderScene = ({ route }) => {
    return (
      <FlatList
        data={route.key === 'all' ? userReactions : userReactions.filter(reaction => reaction.reactionType === route.key)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <BadgeAvatar
              userId={item.userId}
              badgeContent={item.reactionType.toLowerCase()}
              badgeColor={audienceReactionsInfos[item.reactionType].color}
              badgePosition={BadgePosition.bottom}
            />
            <View>
              <BodyText>{item.displayName}</BodyText>
              <CaptionBoldText>{accountTypeInfos[item.profile].text}</CaptionBoldText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyScreen
            svgImage="empty-timeline"
            title={I18n.get('audience-reactions-empty')}
            customTitleStyle={styles.noReactionTitle}
            customStyle={styles.noReactionView}
          />
        }
        contentContainerStyle={styles.flatlist}
      />
    );
  };
  const renderTabBar = (
    tabBarProps: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string; icon: string }> },
  ) => {
    return (
      <TabBar
        renderLabel={({ route, focused }) => renderTabReaction(route.key, countByType![route.key] ?? 0, focused)}
        indicatorStyle={styles.tabBarIndicatorContainer}
        style={styles.tabBarContainer}
        {...tabBarProps}
      />
    );
  };
  const renderContent = () => {
    return (
      <PageView style={styles.container}>
        <TabView
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
        />
      </PageView>
    );
  };
  return <ContentLoader loadContent={loadData} renderContent={renderContent} renderError={() => <EmptyContentScreen />} />;
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
