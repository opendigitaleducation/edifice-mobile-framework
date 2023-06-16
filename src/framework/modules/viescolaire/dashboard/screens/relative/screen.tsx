import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { ModalBoxHandle } from '~/framework/components/ModalBox';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import FlatList from '~/framework/components/list/flat-list';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import { BodyBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { getSession } from '~/framework/modules/auth/reducer';
import ChildPicker from '~/framework/modules/viescolaire/common/components/ChildPicker';
import viescoTheme from '~/framework/modules/viescolaire/common/theme';
import { getChildStructureId } from '~/framework/modules/viescolaire/common/utils/child';
import { homeworkListDetailsAdapter, isHomeworkDone } from '~/framework/modules/viescolaire/common/utils/diary';
import {
  clearCompetencesAction,
  fetchCompetencesDevoirsAction,
  fetchCompetencesSubjectsAction,
  fetchCompetencesUserChildrenAction,
} from '~/framework/modules/viescolaire/competences/actions';
import { DashboardAssessmentCard } from '~/framework/modules/viescolaire/competences/components/Item';
import { IDevoir } from '~/framework/modules/viescolaire/competences/model';
import competencesConfig from '~/framework/modules/viescolaire/competences/module-config';
import { competencesRouteNames } from '~/framework/modules/viescolaire/competences/navigation';
import { ModuleIconButton } from '~/framework/modules/viescolaire/dashboard/components/ModuleIconButton';
import dashboardConfig from '~/framework/modules/viescolaire/dashboard/module-config';
import { DashboardNavigationParams, dashboardRouteNames } from '~/framework/modules/viescolaire/dashboard/navigation';
import { fetchDiaryHomeworksFromChildAction, fetchDiaryTeachersAction } from '~/framework/modules/viescolaire/diary/actions';
import { HomeworkItem } from '~/framework/modules/viescolaire/diary/components/Items';
import { IHomework } from '~/framework/modules/viescolaire/diary/model';
import diaryConfig from '~/framework/modules/viescolaire/diary/module-config';
import { diaryRouteNames } from '~/framework/modules/viescolaire/diary/navigation';
import { edtRouteNames } from '~/framework/modules/viescolaire/edt/navigation';
import { fetchPresencesChildrenEventsAction } from '~/framework/modules/viescolaire/presences/actions';
import ChildrenEventsModal from '~/framework/modules/viescolaire/presences/components/ChildrenEventsModal';
import presencesConfig from '~/framework/modules/viescolaire/presences/module-config';
import { presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryActionLegacy } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import type { DashboardRelativeScreenPrivateProps } from './types';

type IHomeworkByDateList = {
  [key: string]: IHomework[];
};

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<DashboardNavigationParams, typeof dashboardRouteNames.relative>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('dashboard-relative-title'),
  }),
});

const DashboardRelativeScreen = (props: DashboardRelativeScreenPrivateProps) => {
  const scrollRef = React.useRef<typeof ScrollView>();
  const eventsModalRef = React.useRef<ModalBoxHandle>(null);
  const [loadingState, setLoadingState] = React.useState(AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchContent = async () => {
    try {
      const { childId, structureId, userChildren, userId } = props;

      if (!childId || !structureId || !userId) throw new Error();
      await props.fetchHomeworks(
        childId,
        structureId,
        moment().add(1, 'day').format('YYYY-MM-DD'),
        moment().add(1, 'month').format('YYYY-MM-DD'),
      );
      await props.fetchTeachers(structureId);
      await props.fetchDevoirs(structureId, childId);
      await props.fetchSubjects(structureId);
      if (!userChildren.length) {
        const children = await props.fetchUserChildren(structureId, userId);
        await props.fetchChildrenEvents(
          structureId,
          children.map(child => child.id),
        );
      }
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchContent()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  React.useEffect(() => {
    if (loadingState === AsyncPagedLoadingState.DONE) init();
    props.clearCompetences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.childId]);

  React.useEffect(() => {
    if (Object.entries(props.childrenEvents).length) eventsModalRef.current?.doShowModal();
  }, [props.childrenEvents]);

  const openAssessment = (assessment: IDevoir) => {
    const { childId, navigation, userChildren } = props;

    navigation.navigate(competencesRouteNames.assessment, {
      assessment,
      studentClass: userChildren.find(child => child.id === childId)?.idClasse ?? '',
    });
  };

  const renderNavigationGrid = () => {
    const { authorizedViescoApps, navigation } = props;
    const nbModules = Object.values(authorizedViescoApps).filter(x => x).length;

    return (
      <View style={[styles.dashboardPart, nbModules === 4 ? styles.gridAllModules : styles.gridModulesLine]}>
        {authorizedViescoApps.presences ? (
          <ModuleIconButton
            onPress={() => navigation.navigate(presencesRouteNames.history)}
            text={I18n.get('dashboard-relative-presences')}
            color={viescoTheme.palette.presences}
            icon="access_time"
            nbModules={nbModules}
          />
        ) : null}
        {authorizedViescoApps.edt ? (
          <ModuleIconButton
            onPress={() => navigation.navigate(edtRouteNames.home)}
            text={I18n.get('dashboard-relative-edt')}
            color={viescoTheme.palette.edt}
            icon="calendar_today"
            nbModules={nbModules}
          />
        ) : null}
        {authorizedViescoApps.diary ? (
          <ModuleIconButton
            onPress={() => navigation.navigate(diaryRouteNames.homeworkList)}
            text={I18n.get('dashboard-relative-diary')}
            color={viescoTheme.palette.diary}
            icon="checkbox-multiple-marked"
            nbModules={nbModules}
          />
        ) : null}
        {authorizedViescoApps.competences ? (
          <ModuleIconButton
            onPress={() => navigation.navigate(competencesRouteNames.home)}
            text={I18n.get('dashboard-relative-competences')}
            color={viescoTheme.palette.competences}
            icon="equalizer"
            nbModules={nbModules}
          />
        ) : null}
      </View>
    );
  };

  const renderHomework = () => {
    const { homeworks } = props;
    let homeworksByDate = {} as IHomeworkByDateList;
    Object.values(homeworks.data).forEach(hm => {
      const key = moment(hm.due_date).format('YYYY-MM-DD');
      if (typeof homeworksByDate[key] === 'undefined') homeworksByDate[key] = [];
      homeworksByDate[key].push(hm);
    });

    const tomorrowDate = moment().add(1, 'day') as Moment;

    homeworksByDate = Object.keys(homeworksByDate)
      .filter(date => moment(date).isAfter(moment()))
      .sort()
      .slice(0, 5)
      .reduce(function (memo, current) {
        memo[current] = homeworksByDate[current];
        return memo;
      }, {});

    return (
      <View style={styles.dashboardPart}>
        <BodyBoldText>{I18n.get('dashboard-relative-homework-recent')}</BodyBoldText>
        {!Object.keys(homeworksByDate).length ? (
          <EmptyScreen svgImage="empty-homework" title={I18n.get('dashboard-relative-homework-emptyscreen-title')} />
        ) : null}
        {Object.keys(homeworksByDate).map(date => (
          <>
            <SmallText style={styles.subtitle}>
              {moment(date).isSame(tomorrowDate, 'day')
                ? I18n.get('dashboard-relative-homework-duetomorrow')
                : I18n.get('dashboard-relative-homework-duedate', { date: moment(date).format('DD/MM/YYYY') })}
            </SmallText>
            {homeworksByDate[date].map(homework => (
              <HomeworkItem
                disabled
                checked={isHomeworkDone(homework)}
                title={homework.subject_id !== 'exceptional' ? homework.subject.name : homework.exceptional_label}
                subtitle={homework.type}
                onPress={() =>
                  props.navigation.navigate(diaryRouteNames.homework, homeworkListDetailsAdapter(homework, homeworks.data))
                }
              />
            ))}
          </>
        ))}
      </View>
    );
  };

  const renderAssessments = () => {
    const { devoirs, subjects } = props;

    return devoirs.isFetching ? (
      <LoadingIndicator />
    ) : (
      <FlatList
        data={devoirs.data.slice(0, 5)}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <DashboardAssessmentCard
            devoir={item}
            subject={subjects.find(s => s.id === item.subjectId)}
            openAssessment={() => openAssessment(item)}
          />
        )}
        ListHeaderComponent={<BodyBoldText>{I18n.get('dashboard-relative-assessments-recent')}</BodyBoldText>}
        ListEmptyComponent={
          <EmptyScreen svgImage="empty-evaluations" title={I18n.get('dashboard-relative-assessments-emptyscreen-title')} />
        }
        scrollEnabled={false}
        style={styles.dashboardPart}
      />
    );
  };

  const renderDashboard = () => {
    const { authorizedViescoApps, childrenEvents, userChildren } = props;

    return (
      <ScrollView ref={scrollRef}>
        {renderNavigationGrid()}
        {authorizedViescoApps.diary ? renderHomework() : null}
        {authorizedViescoApps.competences ? renderAssessments() : null}
        <ChildrenEventsModal ref={eventsModalRef} childrenEvents={childrenEvents} userChildren={userChildren} />
      </ScrollView>
    );
  };

  return (
    <PageView>
      <ChildPicker>
        {props.hasRightToCreateAbsence ? (
          <TouchableOpacity
            onPress={() => props.navigation.navigate(presencesRouteNames.declareAbsence)}
            style={styles.declareAbsenceButton}>
            <SmallBoldText style={styles.declareAbscenceText}>{I18n.get('dashboard-relative-reportabsence')}</SmallBoldText>
          </TouchableOpacity>
        ) : null}
      </ChildPicker>
      {renderDashboard()}
    </PageView>
  );
};

export default connect(
  (state: IGlobalState) => {
    const competencesState = competencesConfig.getState(state);
    const dashboardState = dashboardConfig.getState(state);
    const presencesState = presencesConfig.getState(state);
    const diaryState = diaryConfig.getState(state);
    const session = getSession();

    return {
      authorizedViescoApps: {
        competences: session?.apps.some(app => app.address === '/competences'),
        diary: session?.apps.some(app => app.address === '/diary'),
        edt: session?.apps.some(app => app.address === '/edt'),
        presences: session?.apps.some(app => app.address === '/presences'),
      },
      childId: dashboardState.selectedChildId,
      childrenEvents: presencesState.childrenEvents.data,
      devoirs: competencesState.devoirs,
      hasRightToCreateAbsence:
        session?.authorizedActions.some(action => action.displayName === 'presences.absence.statements.create') ?? false,
      homeworks: diaryState.homeworks,
      structureId: getChildStructureId(dashboardState.selectedChildId),
      subjects: competencesState.subjects.data,
      userChildren: competencesState.userChildren.data,
      userId: session?.user.id,
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        clearCompetences: clearCompetencesAction,
        fetchChildrenEvents: tryActionLegacy(
          fetchPresencesChildrenEventsAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchChildrenEvents'],
        fetchDevoirs: tryActionLegacy(
          fetchCompetencesDevoirsAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchDevoirs'],
        fetchHomeworks: tryActionLegacy(
          fetchDiaryHomeworksFromChildAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchHomeworks'],
        fetchSubjects: tryActionLegacy(
          fetchCompetencesSubjectsAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchSubjects'],
        fetchTeachers: tryActionLegacy(
          fetchDiaryTeachersAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchTeachers'],
        fetchUserChildren: tryActionLegacy(
          fetchCompetencesUserChildrenAction,
          undefined,
          true,
        ) as unknown as DashboardRelativeScreenPrivateProps['fetchUserChildren'],
      },
      dispatch,
    ),
)(DashboardRelativeScreen);
