import I18n from 'i18n-js';
import moment from 'moment';
import * as React from 'react';
import { RefreshControl, SectionList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewOverflow from 'react-native-view-overflow';
import { NavigationInjectedProps } from 'react-navigation';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import { HeaderTitleAndSubtitle } from '~/framework/components/header';
import { Icon } from '~/framework/components/icon';
import Label from '~/framework/components/label';
import { PageView } from '~/framework/components/page';
import { Text, TextSizeStyle } from '~/framework/components/text';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { getDayOfTheWeek } from '~/framework/util/date';
import { openUrl } from '~/framework/util/linking';
import { computeRelativePath } from '~/framework/util/navigation';
import { IUserSession } from '~/framework/util/session';
import { Trackers } from '~/framework/util/tracker';
import { IHomeworkDiary, IHomeworkDiaryList } from '~/homework/reducers/diaryList';
import { IHomeworkTask } from '~/homework/reducers/tasks';
import { getHomeworkWorkflowInformation } from '~/homework/rights';
import { Loading } from '~/ui/Loading';
import today from '~/utils/today';

import config from '../config';
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
  session: IUserSession;
}

export interface IHomeworkTaskListScreenEventProps {
  onFocus?: () => void;
  onRefresh?: (diaryId: string) => void;
  onScrollBeginDrag?: () => void;
}

interface IHomeworkTaskListScreenState {
  fetching: boolean;
  pastDateLimit: moment.Moment;
}

export type IHomeworkTaskListScreenProps = IHomeworkTaskListScreenDataProps &
  IHomeworkTaskListScreenEventProps &
  NavigationInjectedProps<{}> &
  IHomeworkTaskListScreenState;

type DataType = {
  type: 'day';
  title: moment.Moment;
  data: { type: 'day'; id: string; title: string; content: string; date: moment.Moment }[];
};
type DataTypeOrFooter = DataType | { type: 'footer'; data: [{ type: 'footer' }]; title?: never };

// Main component ---------------------------------------------------------------------------------

export class HomeworkTaskListScreen extends React.PureComponent<IHomeworkTaskListScreenProps, object> {
  state = {
    fetching: false,
    refreshing: false,
    pastDateLimit: today(),
  };

  static getDerivedStateFromProps(nextProps: any, prevState: any) {
    if (nextProps.isFetching !== prevState.fetching) {
      return { fetching: nextProps.isFetching };
    } else return null;
  }

  componentDidUpdate(prevProps: any) {
    const { isFetching, diaryId } = this.props;

    if (prevProps.isFetching !== isFetching) {
      this.setState({ fetching: isFetching });
    }
    if (prevProps.diaryId !== diaryId) {
      this.setState({ pastDateLimit: today() });
    }
  }

  // Render

  render() {
    const { isFetching, didInvalidate, diaryInformation, navigation, error } = this.props;
    const diaryTitle = diaryInformation?.title;
    const pageContent = isFetching && didInvalidate ? <Loading /> : error ? this.renderError() : this.renderList();

    return (
      <PageView
        navigation={navigation}
        navBarWithBack={{
          title: diaryTitle ? <HeaderTitleAndSubtitle title={diaryTitle} subtitle={I18n.t('Homework')} /> : I18n.t('Homework'),
        }}>
        {pageContent}
      </PageView>
    );
  }

  private renderError() {
    return <EmptyContentScreen />;
  }

  private renderList() {
    const { diaryId, tasksByDay, navigation, onRefresh, session } = this.props;
    const { refreshing, pastDateLimit } = this.state;
    let data: DataType[] = tasksByDay
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
    const hasHomework = data.length > 0;
    const pastHomework = data.filter(item => item.title.isBefore(today(), 'day'));
    const hasPastHomeWork = pastHomework.length > 0;
    const remainingPastHomework = pastHomework.filter(item => item.title.isBefore(pastDateLimit, 'day'));
    const displayedPastHomework = pastHomework.filter(item => item.title.isBetween(pastDateLimit, today(), 'day', '[)'));
    const futureHomework = data.filter(item => item.title.isSameOrAfter(today(), 'day'));
    const displayedHomework = [...displayedPastHomework, ...futureHomework];
    const isHomeworkDisplayed = displayedHomework.length > 0;
    const noRemainingPastHomework = remainingPastHomework.length === 0;
    const noFutureHomeworkHiddenPast = futureHomework.length === 0 && pastDateLimit.isSame(today(), 'day');
    const homeworkWorkflowInformation = getHomeworkWorkflowInformation(session);
    const hasCreateHomeworkResourceRight = homeworkWorkflowInformation && homeworkWorkflowInformation.create;

    // Add footer only if there is at least one element
    // We must keep the empty state displaying if the list is empty.
    displayedHomework.length && (displayedHomework as DataTypeOrFooter[]).push({ type: 'footer', data: [{ type: 'footer' }] });

    return (
      <View style={{ flex: 1 }}>
        {noFutureHomeworkHiddenPast ? null : <HomeworkTimeline leftPosition={UI_SIZES.spacing.extraLarge} />}
        <SectionList
          contentContainerStyle={{
            padding: hasHomework ? UI_SIZES.spacing.large : undefined,
            paddingTop: hasHomework ? undefined : 0,
            flex: noFutureHomeworkHiddenPast ? 1 : undefined,
          }}
          sections={displayedHomework as DataType[]}
          CellRendererComponent={ViewOverflow}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title, type } }: { section: DataType }) => {
            if (type !== 'day') {
              return (
                <>
                  <HomeworkTimeline topPosition={26} leftPosition={UI_SIZES.spacing.smallPlus} />
                  <View
                    style={{
                      marginTop: UI_SIZES.spacing.extraLarge,
                      marginBottom: UI_SIZES.spacing.mediumPlus,
                    }}>
                    <Label color={theme.greyPalette.grey} text={I18n.t('homework.homeworkTaskListScreen.noFutureHomework')} />
                  </View>
                </>
              );
            } else {
              const isPastDate = title.isBefore(today(), 'day');
              const dayOfTheWeek = getDayOfTheWeek(title);
              const dayColor = theme.days[dayOfTheWeek];
              const timelineColor = isPastDate ? theme.greyPalette.cloudy : dayColor;
              return (
                <View
                  style={{
                    marginBottom: UI_SIZES.spacing.extraSmall,
                    marginTop: UI_SIZES.spacing.extraLarge,
                  }}>
                  <View style={{ zIndex: 1 }}>
                    <HomeworkDayCheckpoint date={title} />
                  </View>
                  <HomeworkTimeline
                    leftPosition={UI_SIZES.spacing.smallPlus}
                    topPosition={UI_SIZES.spacing.extraSmall}
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
                onPress={() =>
                  navigation!.navigate(computeRelativePath(`${config.name}/details`, navigation.state), { task: item })
                }
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
          ListHeaderComponent={() => {
            const labelColor = noRemainingPastHomework ? theme.greyPalette.grey : theme.greyPalette.black;
            const labelText = I18n.t(
              `homework.homeworkTaskListScreen.${noRemainingPastHomework ? 'noMorePastHomework' : 'displayPastDays'}`,
            );
            return hasPastHomeWork ? (
              <TouchableOpacity
                style={{ alignSelf: 'center' }}
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
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
          ListEmptyComponent={
            noFutureHomeworkHiddenPast ? (
              <EmptyScreen
                svgImage="empty-hammock"
                title={I18n.t(
                  `homework-tasks-emptyScreenTitle${
                    hasPastHomeWork ? '' : hasCreateHomeworkResourceRight ? '-NoTasks' : '-NoTasks-NoCreationRights'
                  }`,
                )}
                text={I18n.t(
                  `homework-tasks-emptyScreenText${
                    hasPastHomeWork
                      ? hasCreateHomeworkResourceRight
                        ? ''
                        : '-NoCreationRights'
                      : hasCreateHomeworkResourceRight
                      ? '-NoTasks'
                      : '-NoTasks-NoCreationRights'
                  }`,
                )}
                buttonText={hasCreateHomeworkResourceRight ? I18n.t('homework-createActivity') : undefined}
                buttonAction={() => {
                  //TODO: create generic function inside oauth (use in myapps, etc.)
                  if (!DEPRECATED_getCurrentPlatform()) {
                    return null;
                  }
                  const url = `${DEPRECATED_getCurrentPlatform()!.url}/homeworks`;
                  openUrl(url);
                  Trackers.trackEvent('Homework', 'GO TO', 'Create in Browser');
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
        <View
          style={{
            flexDirection: 'row',
            borderWidth: UI_SIZES.dimensions.width.tiny,
            borderRadius: UI_SIZES.radius.madium,
            borderColor: theme.greyPalette.cloudy,
            paddingVertical: UI_SIZES.spacing.large,
            paddingRight: UI_SIZES.spacing.extraLarge,
            paddingLeft: UI_SIZES.spacing.large,
            marginLeft: UI_SIZES.spacing.largePlus,
          }}>
          <View style={{ justifyContent: 'center', marginRight: UI_SIZES.spacing.large }}>
            <Icon name="informations" color={theme.greyPalette.stone} size={TextSizeStyle.Huge.fontSize} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.greyPalette.graphite }}>
              {I18n.t('homework.homeworkTaskListScreen.noFutureHomeworkTryAgain')}
            </Text>
          </View>
        </View>
      </>
    ) : null;
}

export default HomeworkTaskListScreen;
