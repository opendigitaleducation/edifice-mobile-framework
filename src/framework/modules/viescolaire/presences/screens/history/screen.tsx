import * as React from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { NavigationState, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import styles from './styles';
import type { PresencesHistoryScreenDispatchProps, PresencesHistoryScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { SmallBoldText, SmallText } from '~/framework/components/text';
import { AccountType, getFlattenedChildren } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import ChildPicker from '~/framework/modules/viescolaire/common/components/ChildPicker';
import { getChildStructureId } from '~/framework/modules/viescolaire/common/utils/child';
import dashboardConfig from '~/framework/modules/viescolaire/dashboard/module-config';
import {
  fetchPresencesAbsenceStatementsAction,
  fetchPresencesSchoolYearAction,
  fetchPresencesStatisticsAction,
  fetchPresencesTermsAction,
  fetchPresencesUserChildrenAction,
} from '~/framework/modules/viescolaire/presences/actions';
import History from '~/framework/modules/viescolaire/presences/components/history';
import Statistics from '~/framework/modules/viescolaire/presences/components/statistics';
import { Event } from '~/framework/modules/viescolaire/presences/model';
import moduleConfig from '~/framework/modules/viescolaire/presences/module-config';
import { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { getPresencesWorkflowInformation } from '~/framework/modules/viescolaire/presences/rights';
import { presencesService } from '~/framework/modules/viescolaire/presences/service';
import { getRecentEvents } from '~/framework/modules/viescolaire/presences/utils/events';
import { navBarOptions } from '~/framework/navigation/navBar';
import { addTime, subtractTime } from '~/framework/util/date';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.history>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('presences-history-title'),
  }),
});

const PresencesHistoryScreen = (props: PresencesHistoryScreenPrivateProps) => {
  const [isInitialized, setInitialized] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { icon: 'ui-trending-up', key: 'statistics', title: I18n.get('presences-history-tab-statistics') },
    { icon: 'ui-forgoing', key: 'history', title: I18n.get('presences-history-tab-history') },
  ]);
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchEvents = async () => {
    try {
      const { classes, selectedChildId, session, userId, userType } = props;
      const structureId =
        userType === AccountType.Student ? session?.user.structures?.[0]?.id : getChildStructureId(selectedChildId);
      const studentId = userType === AccountType.Student ? userId : selectedChildId;

      if (!structureId || !studentId || !userId || !userType) throw new Error();
      const initialized = await presencesService.initialization.getStructureStatus(structureId);

      if (!initialized) {
        setInitialized(false);
        throw new Error();
      }
      const { endDate, startDate } = await props.tryFetchSchoolYear(structureId);
      await props.tryFetchStatistics(studentId, structureId, startDate, endDate);
      await props.tryFetchAbsenceStatements(
        studentId,
        structureId,
        subtractTime(moment(), 1, 'month'),
        addTime(moment(), 1, 'month'),
      );
      let groupId = classes?.[0];
      if (userType === AccountType.Relative) {
        const children = await props.tryFetchUserChildren(userId);
        groupId = children.find(child => child.id === studentId)?.structures[0].classes[0].id;
      }
      await props.tryFetchTerms(structureId, groupId ?? '');
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchEvents()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchEvents()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchEvents()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchEvents()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
      else refreshSilent();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation, props.selectedChildId]);

  React.useEffect(() => {
    if (props.selectedChildId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedChildId]);

  const openEventList = (events: Event[], key: string) => {
    props.navigation.navigate(presencesRouteNames.eventList, {
      events,
      key,
    });
  };

  const renderError = () => {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={reload} />}>
        {isInitialized ? (
          <EmptyContentScreen />
        ) : (
          <EmptyScreen
            svgImage="empty-light"
            title={I18n.get('presences-history-emptyscreen-initialization-title')}
            text={I18n.get('presences-history-emptyscreen-initialization-text')}
            customStyle={styles.pageContainer}
          />
        )}
      </ScrollView>
    );
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'statistics':
        return (
          <Statistics
            isRefreshing={loadingState === AsyncPagedLoadingState.REFRESH}
            statistics={props.statistics}
            terms={props.terms}
            session={props.session}
            openEventList={openEventList}
          />
        );
      case 'history':
        return (
          <History isRefreshing={loadingState === AsyncPagedLoadingState.REFRESH} events={props.events} userType={props.userType} />
        );
      default:
        return null;
    }
  };

  const renderTabBar = (
    tabBarProps: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string; icon: string }> },
  ) => {
    return (
      <TabBar
        renderLabel={({ focused, route }) =>
          focused ? (
            <SmallBoldText style={styles.tabBarLabelFocused}>{route.title}</SmallBoldText>
          ) : (
            <SmallText style={styles.tabBarLabel}>{route.title}</SmallText>
          )
        }
        renderIcon={({ focused, route }) => (
          <Svg name={route.icon} fill={focused ? theme.palette.primary.regular : theme.palette.grey.black} height={20} width={20} />
        )}
        tabStyle={styles.tabBarTabContainer}
        indicatorStyle={styles.tabBarIndicatorContainer}
        style={styles.tabBarContainer}
        pressColor={theme.palette.grey.pearl.toString()}
        {...tabBarProps}
      />
    );
  };

  const renderTabView = () => {
    const { selectedChildId, session, userType } = props;
    const isChildPickerShown = userType === AccountType.Relative && props.children!.length > 1;

    return (
      <>
        {isChildPickerShown ? <ChildPicker contentContainerStyle={styles.childListContentContainer} /> : null}
        {selectedChildId && session && getPresencesWorkflowInformation(session).createAbsenceStatements ? (
          <PrimaryButton
            text={I18n.get('presences-history-reportabsence')}
            iconLeft="ui-plus"
            action={() => props.navigation.navigate(presencesRouteNames.declareAbsence, { childId: selectedChildId })}
            style={[styles.absenceActionContainer, !isChildPickerShown && styles.absenceActionTopMargin]}
          />
        ) : null}
        <TabView
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
        />
      </>
    );
  };

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH:
      case AsyncPagedLoadingState.REFRESH_FAILED:
      case AsyncPagedLoadingState.REFRESH_SILENT:
        return renderTabView();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return <PageView style={styles.pageContainer}>{renderPage()}</PageView>;
};

export default connect(
  (state: IGlobalState) => {
    const presencesState = moduleConfig.getState(state);
    const dashboardState = dashboardConfig.getState(state);
    const session = getSession();
    const userId = session?.user.id;
    const userType = session?.user.type;

    return {
      children:
        userType === AccountType.Relative
          ? (getFlattenedChildren(session?.user.children)?.filter(child => child.classesNames.length) ?? [])
          : undefined,
      classes: session?.user.classes,
      events: getRecentEvents(presencesState.statistics.data, presencesState.absenceStatements.data),
      initialLoadingState: AsyncPagedLoadingState.PRISTINE,
      schoolYear: presencesState.schoolYear.data,
      selectedChildId: userType === AccountType.Relative ? dashboardState.selectedChildId : undefined,
      session,
      statistics: presencesState.statistics.data,
      terms: presencesState.terms.data,
      userId,
      userType,
    };
  },
  dispatch =>
    bindActionCreators<PresencesHistoryScreenDispatchProps>(
      {
        tryFetchAbsenceStatements: tryAction(fetchPresencesAbsenceStatementsAction),
        tryFetchSchoolYear: tryAction(fetchPresencesSchoolYearAction),
        tryFetchStatistics: tryAction(fetchPresencesStatisticsAction),
        tryFetchTerms: tryAction(fetchPresencesTermsAction),
        tryFetchUserChildren: tryAction(fetchPresencesUserChildrenAction),
      },
      dispatch,
    ),
)(PresencesHistoryScreen);
