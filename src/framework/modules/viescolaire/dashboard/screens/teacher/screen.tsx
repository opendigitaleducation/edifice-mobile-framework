import * as React from 'react';
import { View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import styles from './styles';
import type { DashboardTeacherScreenDispatchProps, DashboardTeacherScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { SmallBoldText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { loadStoredStructureAction } from '~/framework/modules/viescolaire/dashboard/actions';
import { ModuleButton } from '~/framework/modules/viescolaire/dashboard/components/ModuleButton';
import { DashboardNavigationParams, dashboardRouteNames } from '~/framework/modules/viescolaire/dashboard/navigation';
import { diaryRouteNames } from '~/framework/modules/viescolaire/diary/navigation';
import { edtRouteNames } from '~/framework/modules/viescolaire/edt/navigation';
import { fetchPresencesCoursesAction } from '~/framework/modules/viescolaire/presences/actions';
import CallCard from '~/framework/modules/viescolaire/presences/components/call-card';
import { Course } from '~/framework/modules/viescolaire/presences/model';
import presencesConfig from '~/framework/modules/viescolaire/presences/module-config';
import { presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { presencesService } from '~/framework/modules/viescolaire/presences/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { subtractTime } from '~/framework/util/date';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<DashboardNavigationParams, typeof dashboardRouteNames.teacher>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('dashboard-teacher-title'),
  }),
});

const DashboardTeacherScreen = (props: DashboardTeacherScreenPrivateProps) => {
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchCourses = async () => {
    try {
      const { structureIds, userId } = props;

      if (!structureIds.length || !userId) throw new Error();
      await props.tryFetchCourses(userId, structureIds, moment(), false);
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchCourses()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchCourses()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (props.userType !== AccountType.Teacher || !props.authorizedViescoApps.presences) return;
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
      else refreshSilent();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  React.useEffect(() => {
    props.tryLoadStoredStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCall = async (course: Course) => {
    try {
      let { callId } = course;

      if (!callId) {
        const { session, userId } = props;
        if (!session || !userId) throw new Error();
        callId = await presencesService.call.create(session, course, userId, false);
      }
      props.navigation.navigate(presencesRouteNames.call, {
        course,
        id: callId,
      });
    } catch {
      Toast.showError(I18n.get('dashboard-teacher-error-text'));
    }
  };

  const openCallList = () => props.navigation.navigate(presencesRouteNames.callList);

  const renderPresences = () => {
    const isFetching = [AsyncPagedLoadingState.PRISTINE, AsyncPagedLoadingState.INIT].includes(loadingState);
    const courses = props.courses[moment().format('YYYY-MM-DD')] ?? [];
    const currentCourse =
      courses.find(course => moment().isBetween(course.startDate, course.endDate)) ??
      courses.find(course => moment().isBetween(subtractTime(course.startDate, 15, 'minutes'), course.endDate));

    return (
      <View style={styles.presencesContainer}>
        <View style={styles.presencesHeadingContainer}>
          <Svg name="presences" fill={theme.palette.complementary.yellow.regular} height={24} width={24} />
          <SmallBoldText>{I18n.get('dashboard-teacher-presences-heading')}</SmallBoldText>
        </View>
        <View style={styles.presencesCallContainer}>
          {isFetching ? (
            <LoadingIndicator />
          ) : currentCourse ? (
            <CallCard course={currentCourse} showStatus onPress={() => openCall(currentCourse)} />
          ) : (
            <View style={styles.presencesEmptyContainer}>
              <Svg name="ui-infoCircle" fill={theme.palette.grey.graphite} height={24} width={24} />
              <SmallBoldText style={styles.presencesEmptyText}>{I18n.get('dashboard-teacher-presences-empty')}</SmallBoldText>
            </View>
          )}
        </View>
        <TertiaryButton
          text={I18n.get('dashboard-teacher-presences-action')}
          iconRight="ui-arrowRight"
          action={openCallList}
          style={styles.presencesCallListAction}
        />
      </View>
    );
  };

  if (props.userType !== AccountType.Teacher) {
    return (
      <EmptyScreen
        svgImage="empty-viesco"
        title={I18n.get('dashboard-teacher-emptyscreen-title')}
        text={I18n.get('dashboard-teacher-emptyscreen-text')}
      />
    );
  }
  return (
    <PageView>
      {props.authorizedViescoApps.presences ? renderPresences() : null}
      <View style={styles.appsGrid}>
        {props.authorizedViescoApps.edt ? (
          <ModuleButton
            onPress={() => props.navigation.navigate(edtRouteNames.home)}
            text={I18n.get('dashboard-teacher-edt')}
            color={theme.palette.complementary.indigo.regular}
            icon="edt"
          />
        ) : null}
        {props.authorizedViescoApps.diary ? (
          <ModuleButton
            onPress={() => props.navigation.navigate(diaryRouteNames.timetable)}
            text={I18n.get('dashboard-teacher-diary')}
            color={theme.palette.complementary.green.regular}
            icon="diary"
          />
        ) : null}
      </View>
    </PageView>
  );
};

export default connect(
  (state: IGlobalState) => {
    const presencesState = presencesConfig.getState(state);
    const session = getSession();
    const hasPresencesApp = session?.rights.apps.some(app => app.address === '/presences');

    return {
      authorizedViescoApps: {
        competences: session?.rights.apps.some(app => app.address === '/competences'),
        diary: session?.rights.apps.some(app => app.address === '/diary'),
        edt: session?.rights.apps.some(app => app.address === '/edt'),
        presences: hasPresencesApp,
      },
      courses: presencesState.courses.data,
      initialLoadingState:
        hasPresencesApp && presencesState.courses.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      session,
      structureIds: session?.user.structures?.map(structure => structure.id) ?? [],
      userId: session?.user.id,
      userType: session?.user.type,
    };
  },
  dispatch =>
    bindActionCreators<DashboardTeacherScreenDispatchProps>(
      {
        tryFetchCourses: tryAction(fetchPresencesCoursesAction),
        tryLoadStoredStructure: tryAction(loadStoredStructureAction),
      },
      dispatch,
    ),
)(DashboardTeacherScreen);
