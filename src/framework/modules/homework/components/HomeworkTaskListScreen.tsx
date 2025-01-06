import * as React from 'react';
import { RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import ViewOverflow from 'react-native-view-overflow';
import { ThunkDispatch } from 'redux-thunk';

import HomeworkCard from './HomeworkCard';
import HomeworkDayCheckpoint from './HomeworkDayCheckpoint';
import HomeworkTimeline from './HomeworkTimeline';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import { Icon } from '~/framework/components/icon';
import Label from '~/framework/components/label';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { pageGutterSize, PageView } from '~/framework/components/page';
import SectionList from '~/framework/components/sectionList';
import { SmallText, TextSizeStyle } from '~/framework/components/text';
import { AccountType, AuthLoggedAccount } from '~/framework/modules/auth/model';
import { HomeworkNavigationParams, homeworkRouteNames } from '~/framework/modules/homework/navigation';
import { IHomeworkDiary, IHomeworkDiaryList } from '~/framework/modules/homework/reducers/diaryList';
import { IHomeworkTask } from '~/framework/modules/homework/reducers/tasks';
import {
  getHomeworkWorkflowInformation,
  hasPermissionManager,
  modifyHomeworkEntryResourceRight,
} from '~/framework/modules/homework/rights';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { getDayOfTheWeek, today } from '~/framework/util/date';
import { Trackers } from '~/framework/util/tracker';
import { Loading } from '~/ui/Loading';

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
  session?: AuthLoggedAccount;
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
  buttonPastHomework: { alignSelf: 'center', marginBottom: UI_SIZES.spacing.big },
  dayCheckpoint: { zIndex: 1 },
  dayCheckpointContainer: { marginBottom: UI_SIZES.spacing.tiny },
  footer: {
    borderColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.medium,
    borderWidth: UI_SIZES.dimensions.width.tiny,
    flexDirection: 'row',
    marginLeft: UI_SIZES.spacing.big,
    paddingLeft: UI_SIZES.spacing.medium,
    paddingRight: UI_SIZES.spacing.big,
    paddingVertical: UI_SIZES.spacing.medium,
  },
  footerIcon: { justifyContent: 'center', marginRight: UI_SIZES.spacing.medium },
  footerText: { color: theme.palette.grey.graphite },
  footerTextContainer: { flex: 1 },
  labelContainer: { marginBottom: UI_SIZES.spacing.small },
  lastCard: { marginBottom: UI_SIZES.spacing.big },
  taskList: { flex: 1 },
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
    pastDateLimit: today(),
    refreshing: false,
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
          data: day.tasks.map(task => ({
            ...task,
            date: day.date,
            type: 'day',
          })),
          title: day.date,
          type: 'day',
        }))
      : [];
    return dataInfo;
  }

  pastHomework() {
    return this.getDataInfo().filter(item => item.title.isBefore(today(), 'day'));
  }

  futureHomework() {
    return this.getDataInfo().filter(item => item.title.isSameOrAfter(today(), 'day'));
  }

  noFutureHomeworkHiddenPast() {
    return this.futureHomework().length === 0;
  }

  hasPastHomeWork() {
    return this.pastHomework().length > 0;
  }

  hasHomework() {
    return this.getDataInfo().length > 0;
  }

  remainingPastHomework() {
    const { pastDateLimit } = this.state;
    return this.pastHomework().filter(item => item.title.isBefore(pastDateLimit, 'day'));
  }

  getDisplayedPastHomework() {
    const { pastDateLimit } = this.state;
    const displayedPastHomework = this.pastHomework().filter(item => item.title.isBetween(pastDateLimit, today(), 'day', '[)'));
    const displayedHomework = [...displayedPastHomework, ...this.futureHomework()];
    // Add footer only if there is at least one element
    // We must keep the empty state displaying if the list is empty.
    if (displayedHomework.length) (displayedHomework as DataTypeOrFooter[]).push({ data: [{ type: 'footer' }], type: 'footer' });
    return displayedHomework;
  }

  getTimlineColor(date: Moment) {
    const isPastDate = date?.isBefore(today(), 'day');
    const dayOfTheWeek = getDayOfTheWeek(date);
    const dayColor = theme.color.homework.days[dayOfTheWeek]?.accent ?? theme.palette.grey.cloudy;
    return isPastDate ? theme.palette.grey.cloudy : dayColor;
  }

  canCreateEntry() {
    const { diaryInformation, session } = this.props;
    const isTeacher = session?.user.type === AccountType.Teacher;
    const hasCreationRight =
      session &&
      (hasPermissionManager(diaryInformation!, modifyHomeworkEntryResourceRight, session) ||
        diaryInformation?.owner.userId === session.user.id) &&
      isTeacher;
    return hasCreationRight;
  }

  addEntry = () => {
    const { navigation } = this.props;
    navigation.navigate(homeworkRouteNames.homeworkCreate, { sourceRoute: homeworkRouteNames.homeworkTaskList });
    Trackers.trackEvent('Homework', 'GO TO', 'Create');
  };

  refreshEntries = async () => {
    const { diaryId, onRefresh } = this.props;
    this.setState({ fetching: true, refreshing: true });
    if (onRefresh && diaryId) {
      await onRefresh(diaryId);
    }
    this.setState({ refreshing: false });
  };

  displayPastHomework = () => {
    const newestRemainingPastHW = this.remainingPastHomework()[this.remainingPastHomework().length - 1];
    const newestRemainingPastHWDate = newestRemainingPastHW.title;
    const newestRemainingPastHWWeekStart = moment(newestRemainingPastHWDate).startOf('isoWeek');
    this.setState({ pastDateLimit: newestRemainingPastHWWeekStart });
  };

  updateNavBarTitle() {
    const { diaryInformation, navigation } = this.props;
    navigation.setOptions({
      // React Navigation 6 uses this syntax to setup nav options

      headerRight: () => (this.canCreateEntry() ? <NavBarAction icon="ui-plus" onPress={this.addEntry} /> : undefined),

      headerTitle: navBarTitle(diaryInformation?.title),
    });
  }

  componentDidMount() {
    this.updateNavBarTitle();
  }

  componentDidUpdate(prevProps: any) {
    const { diaryId, isFetching, isFocused, route, tasksByDay } = this.props;
    const { pastDateLimit } = this.state;
    const createdEntryId = route.params?.createdEntryId;
    const prevCreatedEntryId = prevProps.route.params?.createdEntryId;

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
          itemIndex: createdTaskIndex,
          sectionIndex: createdTaskDayIndex,
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
    const { didInvalidate, error, isFetching } = this.props;
    const pageContent = isFetching && didInvalidate ? <Loading /> : error ? this.renderError() : this.renderList();
    return <PageView>{pageContent}</PageView>;
  }

  private renderError() {
    return <EmptyContentScreen />;
  }

  private renderListHeaderComponent() {
    const noRemainingPastHomework = this.remainingPastHomework().length === 0;
    const labelColor = noRemainingPastHomework ? theme.palette.grey.grey : theme.palette.grey.black;
    const labelText = I18n.get(
      noRemainingPastHomework ? 'homework-tasklist-nomorepasthomework' : 'homework-tasklist-displaypastdays',
    );
    const icon = noRemainingPastHomework ? undefined : 'back';
    return this.hasPastHomeWork() ? (
      <TouchableOpacity style={styles.buttonPastHomework} disabled={noRemainingPastHomework} onPress={this.displayPastHomework}>
        <Label
          labelStyle="outline"
          labelSize="large"
          icon={icon}
          iconStyle={{ transform: [{ rotate: '90deg' }] }}
          color={labelColor}
          text={labelText}
        />
      </TouchableOpacity>
    ) : null;
  }

  private renderListEmptyComponent() {
    const title = I18n.get(
      this.hasPastHomeWork()
        ? 'homework-tasklist-emptyscreen-title'
        : this.canCreateEntry()
          ? 'homework-tasklist-emptyscreen-title-notasks'
          : 'homework-tasklist-emptyscreen-title-notasks-nocreationrights',
    );
    const text = I18n.get(
      this.hasPastHomeWork()
        ? this.canCreateEntry()
          ? 'homework-tasklist-emptyscreen-text'
          : 'homework-tasklist-emptyscreen-text-nocreationrights'
        : this.canCreateEntry()
          ? 'homework-tasklist-emptyscreen-text-notasks'
          : 'homework-tasklist-emptyscreen-text-notasks-nocreationrights',
    );
    const buttonText = this.canCreateEntry() ? I18n.get('homework-tasklist-createactivity') : undefined;

    return this.noFutureHomeworkHiddenPast() || !this.hasHomework() ? (
      <EmptyScreen svgImage="empty-hammock" title={title} text={text} buttonText={buttonText} buttonAction={this.addEntry} />
    ) : null;
  }

  private renderSectionHeader({ section: { title, type } }: { section: DataType }) {
    if (type !== 'day') {
      return (
        <>
          <HomeworkTimeline topPosition={UI_SIZES.spacing.large} />
          <View style={styles.labelContainer}>
            <Label color={theme.palette.grey.grey} text={I18n.get('homework-tasklist-nofuturehomework')} />
          </View>
        </>
      );
    } else {
      return (
        <View style={styles.dayCheckpointContainer}>
          <View style={styles.dayCheckpoint}>
            <HomeworkDayCheckpoint date={title} />
          </View>
          <HomeworkTimeline topPosition={UI_SIZES.spacing.small} color={this.getTimlineColor(title)} />
        </View>
      );
    }
  }

  private renderItem({ index, item, section }) {
    const { diaryId, navigation, session } = this.props;
    const isLastItem = index === section?.data?.length - 1;
    const displayEntry = () => navigation!.navigate(homeworkRouteNames.homeworkTaskDetails, { diaryId, task: item });
    const homeworkWorkflowInformation = session && getHomeworkWorkflowInformation(session);
    const hasCheckHomeworkResourceRight = homeworkWorkflowInformation && homeworkWorkflowInformation.check;

    return (item as unknown as { type: string }).type !== 'day' ? (
      this.renderFooterItem()
    ) : (
      <>
        <HomeworkTimeline topPosition={UI_SIZES.spacing.tiny} color={this.getTimlineColor(section.title)} />
        <HomeworkCard
          key={index}
          title={item.title}
          content={item.content}
          finished={hasCheckHomeworkResourceRight ? item.finished : undefined}
          date={item.date}
          onPress={displayEntry}
          style={isLastItem ? styles.lastCard : undefined}
        />
      </>
    );
  }

  private renderRefreshControl() {
    const { refreshing } = this.state;
    return <RefreshControl refreshing={refreshing} onRefresh={this.refreshEntries} />;
  }

  private renderFooterItem() {
    return this.getDisplayedPastHomework().length > 0 ? (
      <>
        <View style={styles.footer}>
          <View style={styles.footerIcon}>
            <Icon name="informations" color={theme.palette.grey.stone} size={TextSizeStyle.Huge.fontSize} />
          </View>
          <View style={styles.footerTextContainer}>
            <SmallText style={styles.footerText}>{I18n.get('homework-tasklist-nofuturehomework-tryagain')}</SmallText>
          </View>
        </View>
      </>
    ) : null;
  }

  private renderList() {
    const stylesContentSectionList = {
      flex: this.noFutureHomeworkHiddenPast() ? 1 : undefined,
      padding: this.hasHomework() ? UI_SIZES.spacing.medium : undefined,
      paddingTop: !this.hasPastHomeWork() ? UI_SIZES.spacing.big + pageGutterSize : this.hasHomework() ? undefined : 0,
    };

    return (
      <View style={styles.taskList}>
        {this.noFutureHomeworkHiddenPast() ? null : (
          <HomeworkTimeline leftPosition={UI_SIZES.spacing.medium + UI_SIZES.spacing.minor} />
        )}
        <SectionList
          ref={this.sectionListRef}
          contentContainerStyle={stylesContentSectionList}
          sections={this.getDisplayedPastHomework() as DataType[]}
          CellRendererComponent={ViewOverflow}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={section => this.renderSectionHeader(section)}
          renderItem={item => this.renderItem(item)}
          keyExtractor={item => item.id}
          refreshControl={this.renderRefreshControl()}
          ListHeaderComponent={this.renderListHeaderComponent()}
          ListEmptyComponent={this.renderListEmptyComponent()}
        />
      </View>
    );
  }
}

export default function (props) {
  const isFocused = useIsFocused();
  return <HomeworkTaskListScreen {...props} isFocused={isFocused} />;
}
