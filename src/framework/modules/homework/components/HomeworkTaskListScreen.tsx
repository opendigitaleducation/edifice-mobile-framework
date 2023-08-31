import { useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import * as React from 'react';
import { RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import ViewOverflow from 'react-native-view-overflow';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, getScaleHeight } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import { Icon } from '~/framework/components/icon';
import Label from '~/framework/components/label';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import SectionList from '~/framework/components/sectionList';
import { SmallText, TextSizeStyle } from '~/framework/components/text';
import { ISession } from '~/framework/modules/auth/model';
import { HomeworkNavigationParams, homeworkRouteNames } from '~/framework/modules/homework/navigation';
import { IHomeworkDiary, IHomeworkDiaryList } from '~/framework/modules/homework/reducers/diaryList';
import { IHomeworkTask } from '~/framework/modules/homework/reducers/tasks';
import { hasPermissionManager, modifyHomeworkEntryResourceRight } from '~/framework/modules/homework/rights';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { getDayOfTheWeek, today } from '~/framework/util/date';
import { Trackers } from '~/framework/util/tracker';
import { Loading } from '~/ui/Loading';

import HomeworkCard from './HomeworkCard';
import HomeworkDayCheckpoint from './HomeworkDayCheckpoint';
import HomeworkTimeline from './HomeworkTimeline';

// Props definition -------------------------------------------------------------------------------

export interface IHomeworkTaskListScreenDataProps {
  isFetching?: boolean;
  diaryId?: string;
  didInvalidate?: boolean;
  error?: boolean;
  errmsg?: any;
  diaryListData?: IHomeworkDiaryList;
  diaryInformation?: IHomeworkDiary;
  tasksByDay?: {
    id: string;
    date: moment.Moment;
    tasks: IHomeworkTask[];
  }[];
  lastUpdated: any;
  session?: ISession;
  isFocused: boolean;
}

export interface IHomeworkTaskListScreenEventProps {
  onFocus?: () => void;
  onRefresh?: (diaryId: string) => void;
  onScrollBeginDrag?: () => void;
  dispatch: ThunkDispatch<any, any, any>;
}

interface IHomeworkTaskListScreenState {
  fetching?: boolean;
  refreshing?: boolean;
  pastDateLimit: moment.Moment;
}

export type IHomeworkTaskListScreenProps = IHomeworkTaskListScreenDataProps &
  IHomeworkTaskListScreenEventProps &
  NativeStackScreenProps<HomeworkNavigationParams, typeof homeworkRouteNames.homeworkTaskList>;

type DataType = {
  type: 'day';
  title: moment.Moment;
  data: { type: 'day'; id: string; taskId: string; title: string; content: string; date: moment.Moment }[];
};
type DataTypeOrFooter = DataType | { type: 'footer'; data: [{ type: 'footer' }]; title?: never };

const styles = StyleSheet.create({
  buttonPastHomework: {
    alignSelf: 'center',
  },
  dayCheckpoint: {
    zIndex: 1,
  },
  taskList: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    borderWidth: UI_SIZES.dimensions.width.tiny,
    borderRadius: UI_SIZES.radius.medium,
    borderColor: theme.palette.grey.cloudy,
    paddingVertical: UI_SIZES.spacing.medium,
    paddingRight: UI_SIZES.spacing.big,
    paddingLeft: UI_SIZES.spacing.medium,
    marginLeft: UI_SIZES.spacing.big,
  },
  footerIcon: {
    justifyContent: 'center',
    marginRight: UI_SIZES.spacing.medium,
  },
  footerText: {
    flex: 1,
  },
});

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<HomeworkNavigationParams, typeof homeworkRouteNames.homeworkTaskList>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
  }),
});

class HomeworkTaskListScreen extends React.PureComponent<IHomeworkTaskListScreenProps, IHomeworkTaskListScreenState> {
  state = {
    fetching: false,
    refreshing: false,
    pastDateLimit: today(),
  };

  sectionListRef: { current: any } = React.createRef();

  static getDerivedStateFromProps(nextProps: any, prevState: any) {
    if (nextProps.isFetching !== prevState.fetching) {
      return { fetching: nextProps.isFetching };
    } else return null;
  }

  getDataInfo() {
    const { tasksByDay } = this.props;
    const dataInfo: DataType[] = tasksByDay
      ? tasksByDay.map(day => ({
          type: 'day',
          title: day.date,
          data: day.tasks.map(task => ({
            ...task,
            date: day.date,
            type: 'day',
          })),
        }))
      : [];
    return dataInfo;
  }

  getDisplayedPastHomework() {
    const { pastDateLimit } = this.state;
    const pastHomework = this.getDataInfo().filter(item => item.title.isBefore(today(), 'day'));
    const futureHomework = this.getDataInfo().filter(item => item.title.isSameOrAfter(today(), 'day'));
    const displayedPastHomework = pastHomework.filter(item => item.title.isBetween(pastDateLimit, today(), 'day', '[)'));
    const displayedHomework = [...displayedPastHomework, ...futureHomework];
    // Add footer only if there is at least one element
    // We must keep the empty state displaying if the list is empty.
    if (displayedHomework.length) (displayedHomework as DataTypeOrFooter[]).push({ type: 'footer', data: [{ type: 'footer' }] });
    return displayedHomework;
  }

  canCreateEntry() {
    const { diaryInformation, session } = this.props;
    const hasCreationRight =
      session &&
      (hasPermissionManager(diaryInformation!, modifyHomeworkEntryResourceRight, session) ||
        diaryInformation?.owner.userId === session.user.id);
    return hasCreationRight;
  }

  addEntry() {
    const { navigation } = this.props;
    navigation.navigate(homeworkRouteNames.homeworkCreate, { sourceRoute: homeworkRouteNames.homeworkTaskList });
  }

  updateNavBarTitle() {
    const { diaryInformation, navigation } = this.props;
    navigation.setOptions({
      headerTitle: navBarTitle(diaryInformation?.title),
      // React Navigation 6 uses this syntax to setup nav options
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (this.canCreateEntry() ? <NavBarAction icon="ui-plus" onPress={() => this.addEntry()} /> : undefined),
    });
  }

  componentDidMount() {
    this.updateNavBarTitle();
  }

  componentDidUpdate(prevProps: any) {
    const { isFetching, diaryId, tasksByDay, route, isFocused } = this.props;
    const { pastDateLimit } = this.state;
    const createdEntryId = route.params.createdEntryId;
    const prevCreatedEntryId = prevProps.route.params.createdEntryId;

    if (prevProps.isFetching !== isFetching) {
      this.setState({ fetching: isFetching });
    }

    if (!prevProps.isFocused && isFocused && prevCreatedEntryId !== createdEntryId) {
      const createdTask = tasksByDay?.find(day => day.tasks.find(task => task.taskId === createdEntryId));
      const createdTaskDate = createdTask?.date;
      const isPastCreatedTaskHidden = createdTaskDate?.isBefore(pastDateLimit, 'day');

      if (isPastCreatedTaskHidden) {
        const createdTaskDayWeekStart = moment(createdTaskDate).startOf('isoWeek');
        this.setState({ pastDateLimit: createdTaskDayWeekStart });
      }

      setTimeout(() => {
        const createdTaskDayIndex = this.getDisplayedPastHomework()?.findIndex(day =>
          day.data.some(task => task.taskId === createdEntryId),
        );
        const createdTaskIndex = this.getDisplayedPastHomework()?.[createdTaskDayIndex]?.data?.findIndex(
          task => task.taskId === createdEntryId,
        );
        this.sectionListRef?.current?.scrollToLocation({
          sectionIndex: createdTaskDayIndex,
          itemIndex: createdTaskIndex,
          viewPosition: 0.5,
        });
      }, 1000);
    }

    if (prevProps.diaryId !== diaryId) {
      this.setState({ pastDateLimit: today() });
    }

    this.updateNavBarTitle();
  }

  // Render

  render() {
    const { isFetching, didInvalidate, error } = this.props;
    const pageContent = isFetching && didInvalidate ? <Loading /> : error ? this.renderError() : this.renderList();

    return <PageView>{pageContent}</PageView>;
  }

  private renderError() {
    return <EmptyContentScreen />;
  }

  private renderList() {
    const { diaryId, navigation, onRefresh } = this.props;
    const { refreshing, pastDateLimit } = this.state;

    const hasHomework = this.getDataInfo().length > 0;
    const pastHomework = this.getDataInfo().filter(item => item.title.isBefore(today(), 'day'));
    const hasPastHomeWork = pastHomework.length > 0;
    const remainingPastHomework = pastHomework.filter(item => item.title.isBefore(pastDateLimit, 'day'));
    const futureHomework = this.getDataInfo().filter(item => item.title.isSameOrAfter(today(), 'day'));
    const isHomeworkDisplayed = this.getDisplayedPastHomework().length > 0;
    const noRemainingPastHomework = remainingPastHomework.length === 0;
    const noFutureHomeworkHiddenPast = futureHomework.length === 0 && pastDateLimit.isSame(today(), 'day');

    const stylesContentSectionList = {
      padding: hasHomework ? UI_SIZES.spacing.medium : undefined,
      paddingTop: hasHomework ? undefined : 0,
      flex: noFutureHomeworkHiddenPast ? 1 : undefined,
    };

    return (
      <View style={styles.taskList}>
        {noFutureHomeworkHiddenPast ? null : <HomeworkTimeline leftPosition={UI_SIZES.spacing.medium + UI_SIZES.spacing.minor} />}
        <SectionList
          ref={this.sectionListRef}
          contentContainerStyle={stylesContentSectionList}
          sections={this.getDisplayedPastHomework() as DataType[]}
          CellRendererComponent={ViewOverflow}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title, type, data } }: { section: DataType }) => {
            if (type !== 'day') {
              return (
                <>
                  <HomeworkTimeline topPosition={UI_SIZES.spacing.large} leftPosition={UI_SIZES.spacing.minor} />
                  <View
                    style={{
                      marginTop: UI_SIZES.spacing.big,
                      marginBottom: UI_SIZES.spacing.small,
                    }}>
                    <Label color={theme.palette.grey.grey} text={I18n.get('homework-tasklist-nofuturehomework')} />
                  </View>
                </>
              );
            } else {
              const isPastDate = title.isBefore(today(), 'day');
              const dayOfTheWeek = getDayOfTheWeek(title);
              const dayColor = theme.color.homework.days[dayOfTheWeek]?.accent ?? theme.palette.grey.cloudy;
              const timelineColor = isPastDate ? theme.palette.grey.cloudy : dayColor;
              // TODO: use real computed height of HomeworkCard (instead of magic number)
              const timelineHeight = data.length * getScaleHeight(150);
              return (
                <View
                  style={{
                    marginBottom: UI_SIZES.spacing.tiny,
                    marginTop: UI_SIZES.spacing.big,
                  }}>
                  <View style={styles.dayCheckpoint}>
                    <HomeworkDayCheckpoint date={title} />
                  </View>
                  <HomeworkTimeline
                    height={timelineHeight}
                    leftPosition={UI_SIZES.spacing.minor}
                    topPosition={UI_SIZES.spacing.tiny}
                    color={timelineColor}
                  />
                </View>
              );
            }
          }}
          renderItem={({ item, index }) =>
            (item as unknown as { type: string }).type !== 'day' ? (
              this.renderFooterItem(isHomeworkDisplayed)
            ) : (
              <HomeworkCard
                key={index}
                title={item.title}
                content={item.content}
                date={item.date}
                onPress={() => navigation!.navigate(homeworkRouteNames.homeworkTaskDetails, { task: item, diaryId })}
              />
            )
          }
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                this.setState({ fetching: true, refreshing: true });
                if (onRefresh && diaryId) {
                  await onRefresh(diaryId);
                }
                this.setState({ refreshing: false });
              }}
            />
          }
          // eslint-disable-next-line react/no-unstable-nested-components
          ListHeaderComponent={() => {
            const labelColor = noRemainingPastHomework ? theme.palette.grey.grey : theme.palette.grey.black;
            const labelText = I18n.get(`homework-tasklist-${noRemainingPastHomework ? 'nomorepasthomework' : 'displaypastdays'}`);
            return hasPastHomeWork ? (
              <TouchableOpacity
                style={styles.buttonPastHomework}
                disabled={noRemainingPastHomework}
                onPress={() => {
                  const newestRemainingPastHW = remainingPastHomework[remainingPastHomework.length - 1];
                  const newestRemainingPastHWDate = newestRemainingPastHW.title;
                  const newestRemainingPastHWWeekStart = moment(newestRemainingPastHWDate).startOf('isoWeek');
                  this.setState({ pastDateLimit: newestRemainingPastHWWeekStart });
                }}>
                <Label
                  labelStyle="outline"
                  labelSize="large"
                  icon={noRemainingPastHomework ? undefined : 'back'}
                  iconStyle={{ transform: [{ rotate: '90deg' }] }}
                  color={labelColor}
                  text={labelText}
                />
              </TouchableOpacity>
            ) : null;
          }}
          ListEmptyComponent={
            noFutureHomeworkHiddenPast ? (
              <EmptyScreen
                svgImage="empty-hammock"
                title={I18n.get(
                  `homework-tasklist-emptyscreen-title${
                    hasPastHomeWork ? '' : this.canCreateEntry() ? '-notasks' : '-notasks-nocreationrights'
                  }`,
                )}
                text={I18n.get(
                  `homework-tasklist-emptyscreen-text${
                    hasPastHomeWork
                      ? this.canCreateEntry()
                        ? ''
                        : '-nocreationrights'
                      : this.canCreateEntry()
                      ? '-notasks'
                      : '-notasks-nocreationrights'
                  }`,
                )}
                buttonText={this.canCreateEntry() ? I18n.get('homework-tasklist-createactivity') : undefined}
                buttonAction={() => {
                  this.addEntry();
                  Trackers.trackEvent('Homework', 'GO TO', 'Create');
                }}
              />
            ) : null
          }
        />
      </View>
    );
  }

  renderFooterItem = (isHomeworkDisplayed: boolean) =>
    isHomeworkDisplayed ? (
      <>
        <View style={styles.footer}>
          <View style={styles.footerIcon}>
            <Icon name="informations" color={theme.palette.grey.stone} size={TextSizeStyle.Huge.fontSize} />
          </View>
          <View style={styles.footerText}>
            <SmallText style={{ color: theme.palette.grey.graphite }}>
              {I18n.get('homework-tasklist-nofuturehomework-tryagain')}
            </SmallText>
          </View>
        </View>
      </>
    ) : null;
}

export default function (props) {
  const isFocused = useIsFocused();
  return <HomeworkTaskListScreen {...props} isFocused={isFocused} />;
}
