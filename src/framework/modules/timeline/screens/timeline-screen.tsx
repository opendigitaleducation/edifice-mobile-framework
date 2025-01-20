import * as React from 'react';
import { Alert, ListRenderItemInfo, RefreshControl, View } from 'react-native';

import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { SwipeListView } from 'react-native-swipe-list-view';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import type { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { cardPaddingMerging } from '~/framework/components/card/base';
import { UI_STYLES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { pageGutterSize, PageView } from '~/framework/components/page';
import SwipeableList from '~/framework/components/swipeableList';
import { SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import {
  dismissFlashMessageAction,
  loadNotificationsPageAction,
  startLoadNotificationsAction,
} from '~/framework/modules/timeline/actions';
import TimelineNotification from '~/framework/modules/timeline/components/notification';
import TimelineSpace from '~/framework/modules/timeline/components/space';
import TimelineFlashMessage from '~/framework/modules/timeline/components/timeline-flash-message';
import moduleConfig from '~/framework/modules/timeline/module-config';
import { ITimelineNavigationParams, timelineRouteNames } from '~/framework/modules/timeline/navigation';
import { FlashMessagesStateData, IEntcoreFlashMessage } from '~/framework/modules/timeline/reducer/flash-messages';
import { NotificationsState } from '~/framework/modules/timeline/reducer/notifications';
import { getTimelineWorkflowInformation } from '~/framework/modules/timeline/rights';
import { notificationsService } from '~/framework/modules/timeline/service';
import { getTimelineWorkflows } from '~/framework/modules/timeline/timeline-modules';
import { userRouteNames } from '~/framework/modules/user/navigation';
import { navigate } from '~/framework/navigation/helper';
import { navBarOptions } from '~/framework/navigation/navBar';
import { openUrl } from '~/framework/util/linking';
import {
  IAbstractNotification,
  IResourceUriNotification,
  isResourceUriNotification,
  ITimelineNotification,
} from '~/framework/util/notifications';
import {
  defaultNotificationActionStack,
  handleNotificationAction,
  NotifHandlerThunkAction,
} from '~/framework/util/notifications/routing';

// TYPES ==========================================================================================

export interface ITimelineScreenDataProps {
  flashMessages: FlashMessagesStateData;
  notifications: NotificationsState;
  session: AuthLoggedAccount;
}
export interface ITimelineScreenEventProps {
  dispatch: ThunkDispatch<any, any, any>;
  handleInitTimeline(): Promise<void>;
  handleNextPage(): Promise<boolean>; // return true if page if there is more pages to load
  handleDismissFlashMessage(flashMessageId: number): Promise<void>;
  handleOpenNotification(
    n: IAbstractNotification,
    fallback: NotifHandlerThunkAction,
    navigation: NavigationProp<ParamListBase>,
  ): Promise<void>;
}
export type ITimelineScreenProps = ITimelineScreenDataProps &
  ITimelineScreenEventProps &
  NativeStackScreenProps<ITimelineNavigationParams, 'Home'>;

export enum TimelineLoadingState {
  PRISTINE,
  INIT,
  REFRESH,
  REFRESH_SILENT,
  DONE,
}
export interface ITimelineScreenState {
  loadingState: TimelineLoadingState; // Holds the initial loading state. further page loading is handled by async.isFetching
}

export enum ITimelineItemType {
  NOTIFICATION,
  FLASHMSG,
}
export interface ITimelineItem {
  type: ITimelineItemType;
  data: ITimelineNotification | IEntcoreFlashMessage;
}

const NOTIFICATION_THROTLE_DELAY = 250;
let notificationOpenThrottle = true;

// UTILS ==========================================================================================

const getTimelineItems = (flashMessages: FlashMessagesStateData, notifications: NotificationsState) => {
  const msgs = flashMessages ?? [];
  const notifs = notifications && notifications.data ? notifications.data : [];
  const ret = [] as (ITimelineItem & { key: string })[];
  for (const fm of msgs) {
    if (!fm.dismiss) {
      ret.push({ data: fm, key: fm.id.toString(), type: ITimelineItemType.FLASHMSG });
    }
  }
  for (const n of notifs) {
    ret.push({ data: n, key: n.id, type: ITimelineItemType.NOTIFICATION });
  }
  return ret;
};

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ITimelineNavigationParams, typeof timelineRouteNames.Home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('timeline-appname'),
    titleTestID: 'timeline-title',
  }),
  headerLeft: () => (
    <NavBarAction
      icon="ui-filter"
      onPress={() => {
        navigate(timelineRouteNames.Filters);
      }}
      testID="timeline-filter-button"
    />
  ),
});

// COMPONENT ======================================================================================

function NotificationItem({
  doOpenMoodMottoNotification,
  doOpenNotification,
  notification,
  notificationTestID,
}: {
  notification: ITimelineNotification;
  doOpenNotification: typeof TimelineScreen.prototype.doOpenNotification;
  doOpenMoodMottoNotification: typeof TimelineScreen.prototype.doOpenMoodMottoNotification;
  notificationTestID?: string;
}) {
  const onNotificationAction = React.useMemo(
    () => {
      if (notification.type === 'USERBOOK_MOTTO' || notification.type === 'USERBOOK_MOOD')
        return () => doOpenMoodMottoNotification(notification.backupData.sender!);
      if (isResourceUriNotification(notification))
        return () => doOpenNotification(notification as ITimelineNotification & IResourceUriNotification);
      return undefined;
    },
    // Since notifications are immutable, we can memoize them only by id safely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notification.id, doOpenNotification],
  );
  return (
    <TimelineNotification
      notification={notification}
      notificationAction={onNotificationAction}
      {...(notificationTestID ? { testID: notificationTestID } : {})}
    />
  );
}

export class TimelineScreen extends React.PureComponent<ITimelineScreenProps, ITimelineScreenState> {
  // DECLARATIONS =================================================================================

  state: ITimelineScreenState = {
    loadingState: TimelineLoadingState.PRISTINE,
  };

  rights = getTimelineWorkflowInformation(this.props.session);

  // RENDER =======================================================================================

  render() {
    return (
      <>
        <PageView>
          {[TimelineLoadingState.PRISTINE, TimelineLoadingState.INIT].includes(this.state.loadingState) ? (
            <LoadingIndicator />
          ) : this.props.notifications.error && !this.props.notifications.lastSuccess ? (
            this.renderError()
          ) : (
            this.renderList()
          )}
        </PageView>
      </>
    );
  }

  renderError() {
    return (
      <SmallText>{`Error: ${this.props.notifications.error?.name}
    ${this.props.notifications.error?.name}`}</SmallText>
    ); // ToDo: great error screen here
  }

  listKeyExtractor(n: ITimelineItem & { key: string }) {
    return n.data.id.toString();
  }

  listRenderItem({ index, item }: ListRenderItemInfo<ITimelineItem>) {
    return item.type === ITimelineItemType.NOTIFICATION ? (
      <NotificationItem
        notification={item.data as ITimelineNotification}
        doOpenNotification={this.doOpenNotification.bind(this)}
        doOpenMoodMottoNotification={this.doOpenMoodMottoNotification.bind(this)}
        notificationTestID={`timeline-notification-${index}`}
      />
    ) : (
      this.renderFlashMessageItem(item.data as IEntcoreFlashMessage)
    );
  }

  listSwipeActions({ item }: ListRenderItemInfo<ITimelineItem>) {
    return {
      right: this.rights.notification.report
        ? item.type === ITimelineItemType.NOTIFICATION
          ? [
              {
                action: async row => {
                  try {
                    await this.doReportConfirm(item.data as ITimelineNotification);
                    row[item.data.id]?.closeRow();
                  } catch {
                    /* empty */
                  } // Do nothing, just to prevent error
                },
                actionColor: theme.palette.status.warning.regular,
                actionIcon: 'ui-warning',
                actionText: I18n.get('timeline-reportaction-button'),
              },
            ]
          : item.type === ITimelineItemType.FLASHMSG
            ? [
                {
                  action: async row => {
                    try {
                      await this.doDismissFlashMessage((item.data as IEntcoreFlashMessage).id);
                      row[item.data.id]?.closeRow();
                    } catch {
                      /* empty */
                    } // Do nothing, just to prevent error
                  },
                  actionColor: theme.palette.status.failure.regular,
                  actionIcon: 'ui-close',
                  actionText: I18n.get('timeline-close'),
                },
              ]
            : undefined
        : undefined,
    };
  }

  listSeparator = (
    <>
      <View style={{ height: pageGutterSize }} />
      <TimelineSpace session={this.props.session} />
    </>
  );

  listRef = React.createRef<SwipeListView<ITimelineItem & { key: string }>>();

  renderList() {
    const items = getTimelineItems(this.props.flashMessages, this.props.notifications);
    const isEmpty = items && items.length === 0;

    return (
      <>
        <SwipeableList<ITimelineItem & { key: string }>
          ref={this.listRef}
          // data
          data={items}
          keyExtractor={this.listKeyExtractor.bind(this)}
          contentContainerStyle={isEmpty ? UI_STYLES.flex1 : undefined}
          renderItem={this.listRenderItem.bind(this)}
          // pagination
          ListEmptyComponent={this.renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={[TimelineLoadingState.REFRESH, TimelineLoadingState.INIT].includes(this.state.loadingState)}
              onRefresh={this.doRefresh.bind(this)}
            />
          }
          ListFooterComponent={
            this.state.loadingState === TimelineLoadingState.DONE && this.props.notifications.isFetching ? (
              <LoadingIndicator withVerticalMargins />
            ) : null
          }
          ListHeaderComponent={this.listSeparator}
          onEndReached={this.doNextPage.bind(this)}
          onEndReachedThreshold={1}
          // Swipeable props
          swipeActionWidth={140}
          hiddenRowStyle={cardPaddingMerging}
          hiddenItemStyle={UI_STYLES.justifyEnd}
          itemSwipeActionProps={this.listSwipeActions.bind(this)}
        />
      </>
    );
  }

  renderEmpty() {
    return (
      <EmptyScreen
        svgImage="empty-timeline"
        title={I18n.get('timeline-emptyscreen-title')}
        text={I18n.get('timeline-emptyscreen-text')}
      />
    );
  }

  renderFlashMessageItem(flashMessage: IEntcoreFlashMessage) {
    return (
      <TimelineFlashMessage flashMessage={flashMessage} flashMessageAction={() => this.doDismissFlashMessage(flashMessage.id)} />
    );
  }

  // LIFECYCLE ====================================================================================

  componentDidMount() {
    this.doInit();
  }

  componentDidUpdate(prevProps) {
    const { navigation, route } = this.props;
    const reloadWithNewSettings = route.params.reloadWithNewSettings;
    if (navigation.isFocused !== prevProps.isFocused && reloadWithNewSettings) {
      this.doInit();
      navigation.setParams({ reloadWithNewSettings: undefined });
    }

    let workflows;
    if (getTimelineWorkflows(this.props.session)) {
      workflows = getTimelineWorkflows(this.props.session);
    }
    if (workflows.length) {
      this.props.navigation.setOptions({
        headerRight: () => (
          <PopupMenu actions={workflows}>
            <NavBarAction icon="ui-plus" testID="timeline-add-button" />
          </PopupMenu>
        ),
      });
    }
  }

  // METHODS ======================================================================================

  async doInit() {
    try {
      this.setState({ loadingState: TimelineLoadingState.INIT });
      await this.props.handleInitTimeline();
    } finally {
      this.setState({ loadingState: TimelineLoadingState.DONE });
    }
  }

  async doRefresh() {
    try {
      this.setState({ loadingState: TimelineLoadingState.REFRESH });
      await this.props.handleInitTimeline();
    } finally {
      this.setState({ loadingState: TimelineLoadingState.DONE });
    }
  }

  async doRefreshSilent() {
    try {
      this.setState({ loadingState: TimelineLoadingState.REFRESH_SILENT });
      await this.props.handleInitTimeline();
    } finally {
      this.setState({ loadingState: TimelineLoadingState.DONE });
    }
  }

  async doNextPage() {
    if (!this.props.notifications.endReached) await this.props.handleNextPage();
  }

  doOpenMoodMottoNotification(userId: string) {
    this.props.navigation.navigate(userRouteNames.profile, { userId });
  }

  async doOpenNotification(n: IResourceUriNotification) {
    const fallbackHandleNotificationAction: NotifHandlerThunkAction = nn => async (dispatch, getState) => {
      if (isResourceUriNotification(nn)) openUrl((nn as IResourceUriNotification).resource.uri);
      return { managed: 1 };
    };
    if (notificationOpenThrottle && this.props.handleOpenNotification) {
      notificationOpenThrottle = false;
      this.props.handleOpenNotification(n, fallbackHandleNotificationAction, this.props.navigation);
      setTimeout(() => {
        notificationOpenThrottle = true;
      }, NOTIFICATION_THROTLE_DELAY);
    }
  }

  async doDismissFlashMessage(flashMessageId: number) {
    await this.props.handleDismissFlashMessage(flashMessageId);
  }

  goToFilters() {
    // this.listRef.current?.recenter();
    this.props.navigation.navigate(timelineRouteNames.Filters);
  }

  doReportConfirm(notif: ITimelineNotification) {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.rights.notification.report) reject(this.rights.notification.report);
      Alert.alert(I18n.get('timeline-reportaction-title'), I18n.get('timeline-reportaction-description'), [
        {
          onPress: async () => {
            try {
              await notificationsService.report(this.props.session, notif.id);
              resolve(true);
              Toast.showSuccess(I18n.get('timeline-reportaction-success'));
            } catch (e) {
              Alert.alert(I18n.get('timeline-error-text'));
              reject(e);
            }
          },
          style: 'destructive',
          text: I18n.get('timeline-reportaction-submit'),
        },
        {
          onPress: () => {
            resolve(false);
          },
          style: 'cancel',
          text: I18n.get('common-cancel'),
        },
      ]);
    });
  }
}

// MAPPING ========================================================================================

const mapStateToProps: (s: IGlobalState) => ITimelineScreenDataProps = s => {
  const ts = moduleConfig.getState(s);
  const session = getSession();
  if (session === undefined) throw new Error('TimelineScreen : session not defined');
  return {
    flashMessages: ts.flashMessages.data,
    notifications: ts.notifications,
    session,
  };
};

const mapDispatchToProps: (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => ITimelineScreenEventProps = (
  dispatch,
  getState,
) => ({
  dispatch,
  // TS BUG: await is needed here and type is correct
  handleDismissFlashMessage: async (flashMessageId: number) => {
    try {
      await dispatch(dismissFlashMessageAction(flashMessageId));
    } catch {
      Toast.showError(I18n.get('timeline-flashmessage-dismisserror-text'));
    }
  },

  handleInitTimeline: async () => {
    await dispatch(startLoadNotificationsAction());
  },
  handleNextPage: async () => {
    return dispatch(loadNotificationsPageAction()) as unknown as Promise<boolean>;
  },
  handleOpenNotification: async (
    n: IAbstractNotification,
    fallback: NotifHandlerThunkAction,
    navigation: NavigationProp<ParamListBase, keyof ParamListBase, string>,
  ) => {
    dispatch(handleNotificationAction(n, defaultNotificationActionStack, navigation, 'Timeline Notification', false));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(TimelineScreen);
