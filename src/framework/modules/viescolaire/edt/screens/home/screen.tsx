import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import { NavigationState, SceneMap, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import styles from './styles';
import { EdtHomeScreenDispatchProps, EdtHomeScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import DateTimePicker from '~/framework/components/dateTimePicker';
import { EmptyContentScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { CaptionBoldText, CaptionText, SmallBoldItalicText, SmallBoldText, SmallText } from '~/framework/components/text';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import ChildPicker from '~/framework/modules/viescolaire/common/components/ChildPicker';
import StructurePicker from '~/framework/modules/viescolaire/common/components/StructurePicker';
import Timetable from '~/framework/modules/viescolaire/common/components/Timetable';
import viescoTheme from '~/framework/modules/viescolaire/common/theme';
import { getChildStructureId } from '~/framework/modules/viescolaire/common/utils/child';
import dashboardConfig from '~/framework/modules/viescolaire/dashboard/module-config';
import {
  fetchEdtClassGroupsAction,
  fetchEdtCoursesAction,
  fetchEdtSlotsAction,
  fetchEdtTeacherCoursesAction,
  fetchEdtTeachersAction,
  fetchEdtUserChildrenAction,
} from '~/framework/modules/viescolaire/edt/actions';
import { IEdtCourse } from '~/framework/modules/viescolaire/edt/model';
import moduleConfig from '~/framework/modules/viescolaire/edt/module-config';
import { EdtNavigationParams, edtRouteNames } from '~/framework/modules/viescolaire/edt/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<EdtNavigationParams, typeof edtRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('edt-home-title'),
  }),
});

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const EdtHomeScreen = (props: EdtHomeScreenPrivateProps) => {
  const [index, setIndex] = React.useState(0);
  const [weekdays, setWeekdays] = React.useState<Moment[]>([]);
  const [routes, setRoutes] = React.useState([
    { key: 'monday', title: I18n.get('date-monday') },
    { key: 'tuesday', title: I18n.get('date-tuesday') },
    { key: 'wednesday', title: I18n.get('date-wednesday') },
    { key: 'thursday', title: I18n.get('date-thursday') },
    { key: 'friday', title: I18n.get('date-friday') },
    { key: 'saturday', title: I18n.get('date-saturday') },
  ]);
  const [startDate, setStartDate] = React.useState<Moment>(
    moment().day() === 0 ? moment().clone().add(1, 'd').clone().day(1).startOf('day') : moment().clone().day(1).startOf('day'),
  );
  const [selectedDate, setSelectedDate] = React.useState<Moment>(
    moment().day() === 0 ? moment().clone().add(1, 'd') : moment().clone().startOf('day'),
  );
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchTimetable = async () => {
    try {
      const { childId, classes, structureId, userId, userType } = props;
      const endDate = startDate.clone().endOf('week');

      if (!structureId || !userId || !userType) throw new Error();
      if (userType === AccountType.Teacher) {
        await props.tryFetchTeacherCourses(structureId, startDate, endDate, userId);
      } else {
        let childClasses = classes;
        if (userType === AccountType.Relative) {
          const children = await props.tryFetchUserChildren();
          childClasses = children.find(c => c.id === childId)?.idClasses;
        }
        const classGroups = await props.tryFetchClassGroups(childClasses ?? [], childId);
        await props.tryFetchCourses(structureId, startDate, endDate, classGroups);
      }
      await props.tryFetchTeachers(structureId);
      await props.tryFetchSlots(structureId);
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchTimetable()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchTimetable()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchTimetable()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchTimetable()
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
  }, [props.navigation]);

  React.useEffect(() => {
    if (loadingRef.current === AsyncPagedLoadingState.DONE) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.childId, props.structureId]);

  React.useEffect(() => {
    if (loadingRef.current === AsyncPagedLoadingState.DONE) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  const updateSelectedDate = (newDate: Moment) => {
    const newStartDate = newDate.clone().day(1).startOf('day');
    if (!newStartDate.isSame(startDate, 'day')) setStartDate(newStartDate);
    setSelectedDate(newDate);
  };

  const renderError = () => {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={reload} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const getTeacherName = (teacherIds: string[]): string => {
    return props.teachers.find(teacher => teacher.id === teacherIds[0])?.displayName ?? '';
  };

  const renderCourse = (course: IEdtCourse): React.ReactElement => {
    const isTeacher = props.userType === AccountType.Teacher;
    const className = course.classes.length ? course.classes[0] : course.groups[0];
    const firstText = isTeacher ? className : course.subject.name;
    const secondText = isTeacher ? course.subject.name : getTeacherName(course.teacherIds);
    const hasTag = course.tags.length > 0 && course.tags[0].label.toLocaleUpperCase() !== 'ULIS';
    const isActive = moment().isBetween(course.startDate, course.endDate);

    return (
      <View style={[styles.courseView, hasTag && styles.taggedCourseBackground, isActive && styles.activeCourseBorder]}>
        <View style={[styles.subjectView, styles.halfSplitLineView, styles.firstTextLine]}>
          <SmallText numberOfLines={1}>{firstText}</SmallText>
          <CaptionText style={[styles.halfTextStyle, { color: theme.palette.grey.graphite }]} numberOfLines={1}>
            {secondText}
          </CaptionText>
        </View>
        <View style={[styles.halfSplitLineView, styles.firstTextLine]}>
          {course.roomLabels[0]?.length ? (
            <View style={styles.roomView}>
              <CaptionBoldText numberOfLines={1}>
                &nbsp;{`${I18n.get('edt-home-course-room')} ${course.roomLabels[0]}`}
              </CaptionBoldText>
            </View>
          ) : null}
          {course.tags.length ? <SmallBoldItalicText numberOfLines={1}>{course.tags[0].label}</SmallBoldItalicText> : null}
        </View>
      </View>
    );
  };

  const renderHalfCourse = (course: IEdtCourse) => {
    const isTeacher = props.userType === AccountType.Teacher;
    const className = course.classes.length ? course.classes[0] : course.groups[0];
    const firstText = isTeacher ? className : course.subject.name;
    const secondText = isTeacher ? course.subject.name : getTeacherName(course.teacherIds);
    const hasTag = course.tags.length > 0 && course.tags[0].label.toLocaleUpperCase() !== 'ULIS';
    const isActive = moment().isBetween(course.startDate, course.endDate);

    return (
      <View style={[styles.halfCourseView, hasTag && styles.taggedCourseBackground, isActive && styles.activeCourseBorder]}>
        <View style={[styles.halfSplitLineView, styles.firstTextLine]}>
          <SmallText style={styles.halfTextStyle} numberOfLines={1}>
            {firstText}
          </SmallText>
          {course.roomLabels[0]?.length ? (
            <View style={styles.halfRoomLabelContainer}>
              <CaptionBoldText numberOfLines={1}>{course.roomLabels[0]}</CaptionBoldText>
            </View>
          ) : null}
        </View>
        <View style={styles.halfSplitLineView}>
          <CaptionText style={[styles.halfTextStyle, { color: theme.palette.grey.graphite }]} numberOfLines={1}>
            {secondText}
          </CaptionText>
          {course.tags.length ? <SmallBoldItalicText numberOfLines={1}>{course.tags[0].label}</SmallBoldItalicText> : null}
        </View>
      </View>
    );
  };

  const getWeekdays = (displaySunday?: boolean): Moment[] => {
    const weekdaysData: Moment[] = [];
    const numberOfDays = displaySunday ? 7 : 6;
    const routesData: any[] = [];

    for (let i = 0; i < numberOfDays; i += 1) {
      const date = startDate.clone().add(i, 'day');
      if (date.isSame(selectedDate)) setIndex(i);
      weekdaysData.push(date);
      routesData.push({
        key: days[i],
        title: `${I18n.get('date-' + days[i])}\n${moment(date).format('DD')}`,
        ...(moment(date).isSame(new Date(), 'day') ? { icon: 'today' } : null),
      });
    }
    setRoutes(routesData);
    return weekdaysData;
  };

  React.useEffect(() => {
    setWeekdays(getWeekdays());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const renderTabbar = (
    tabBarProps: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string; icon: string }> },
  ) => {
    return (
      <TabBar
        renderLabel={({ focused, route }) => (
          <View
            style={[
              styles.tabBarItem,
              {
                backgroundColor: focused ? theme.color.homework.days[route.key]?.background : theme.palette.grey.white,
                borderColor: focused
                  ? theme.color.homework.days[route.key]?.accent
                  : route.icon
                    ? theme.palette.grey.grey
                    : theme.palette.grey.white,
              },
            ]}>
            <CaptionBoldText style={styles.tabBarItemText}>{route.title}</CaptionBoldText>
          </View>
        )}
        indicatorStyle={styles.tabBarIndicator}
        style={styles.tabBar}
        pressColor={theme.palette.grey.pearl.toString()}
        {...tabBarProps}
      />
    );
  };

  const renderScrollView = (date: Moment) => {
    return (
      <Timetable
        courses={props.courses ?? []}
        slots={props.slots ?? []}
        date={date}
        renderCourse={renderCourse}
        renderCourseHalf={renderHalfCourse}
      />
    );
  };

  const renderTimetable = () => {
    return (
      <>
        <View style={styles.weekPickerView}>
          <Svg
            name="ui-calendar"
            width={UI_SIZES.elements.icon.small}
            height={UI_SIZES.elements.icon.small}
            fill={theme.palette.grey.black}
          />
          <SmallBoldText style={styles.weekText}>{I18n.get('edt-home-week')}</SmallBoldText>
          <DateTimePicker mode="date" value={selectedDate} onChangeValue={updateSelectedDate} iconColor={viescoTheme.palette.edt} />
        </View>
        <TabView
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          animationEnabled={false}
          renderScene={SceneMap({
            friday: () => renderScrollView(weekdays[4]),
            monday: () => renderScrollView(weekdays[0]),
            saturday: () => renderScrollView(weekdays[5]),
            thursday: () => renderScrollView(weekdays[3]),
            tuesday: () => renderScrollView(weekdays[1]),
            wednesday: () => renderScrollView(weekdays[2]),
          })}
          renderTabBar={renderTabbar}
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
        return renderTimetable();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return (
    <PageView>
      <View style={styles.header}>
        {props.userType === AccountType.Teacher ? <StructurePicker /> : null}
        {props.userType === AccountType.Relative ? (
          <ChildPicker contentContainerStyle={styles.childPickerContentContainer} style={styles.childPicker} />
        ) : null}
      </View>
      {renderPage()}
    </PageView>
  );
};

export default connect(
  (state: IGlobalState) => {
    const edtState = moduleConfig.getState(state);
    const dashboardState = dashboardConfig.getState(state);
    const session = getSession();
    const userId = session?.user.id;
    const userType = session?.user.type;

    return {
      childId: userType === AccountType.Student ? userId : dashboardState.selectedChildId,
      classes: session?.user.classes,
      courses: edtState.courses.data,
      initialLoadingState: edtState.courses.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      slots: edtState.slots.data,
      structureId:
        userType === AccountType.Student
          ? session?.user.structures?.[0]?.id
          : userType === AccountType.Relative
            ? getChildStructureId(dashboardState.selectedChildId)
            : dashboardState.selectedStructureId,
      teachers: edtState.teachers.data,
      userId,
      userType,
    };
  },
  dispatch =>
    bindActionCreators<EdtHomeScreenDispatchProps>(
      {
        tryFetchClassGroups: tryAction(fetchEdtClassGroupsAction),
        tryFetchCourses: tryAction(fetchEdtCoursesAction),
        tryFetchSlots: tryAction(fetchEdtSlotsAction),
        tryFetchTeacherCourses: tryAction(fetchEdtTeacherCoursesAction),
        tryFetchTeachers: tryAction(fetchEdtTeachersAction),
        tryFetchUserChildren: tryAction(fetchEdtUserChildrenAction),
      },
      dispatch,
    ),
)(EdtHomeScreen);
