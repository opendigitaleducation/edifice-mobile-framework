import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import * as React from 'react';
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import FlatList from '~/framework/components/flatList';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import { SmallBoldText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import StructurePicker from '~/framework/modules/viescolaire/common/components/StructurePicker';
import { getSelectedStructure } from '~/framework/modules/viescolaire/dashboard/state/structure';
import {
  fetchPresencesCoursesAction,
  fetchPresencesEventReasonsAction,
  fetchPresencesMultipleSlotSettingAction,
  fetchPresencesRegisterPreferenceAction,
} from '~/framework/modules/viescolaire/presences/actions';
import { CallCard } from '~/framework/modules/viescolaire/presences/components/CallCard';
import { ICourse } from '~/framework/modules/viescolaire/presences/model';
import moduleConfig from '~/framework/modules/viescolaire/presences/module-config';
import { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { presencesService } from '~/framework/modules/viescolaire/presences/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { tryActionLegacy } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import { PresencesCourseListScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.courseList>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('viesco-presences'),
  }),
});

const PresencesCourseListScreen = (props: PresencesCourseListScreenPrivateProps) => {
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchCourses = async () => {
    try {
      const { structureId, teacherId } = props;

      if (!structureId || !teacherId) throw new Error();
      const allowMultipleSlots = await props.fetchMultipleSlotsSetting(structureId);
      const registerPreference = await props.fetchRegisterPreference();
      await props.fetchEventReasons(structureId);
      const today = moment().format('YYYY-MM-DD');
      let multipleSlot = true;
      if (allowMultipleSlots && registerPreference) {
        multipleSlot = JSON.parse(registerPreference).multipleSlot;
      }
      await props.fetchCourses(teacherId, structureId, today, today, multipleSlot);
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

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchCourses()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchCourses()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchCourses()
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
    if (loadingRef.current === AsyncPagedLoadingState.DONE) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.structureId]);

  const openCall = async (course: ICourse) => {
    try {
      let { registerId } = course;

      if (!registerId) {
        const { allowMultipleSlots, session, teacherId } = props;
        if (!session || !teacherId) throw new Error();
        const courseRegister = await presencesService.courseRegister.create(session, course, teacherId, allowMultipleSlots);
        registerId = courseRegister.id;
      }
      props.navigation.navigate(presencesRouteNames.call, {
        classroom: course.roomLabels[0],
        id: registerId,
        name: course.classes[0] ?? course.groups[0],
      });
    } catch {
      Toast.showError(I18n.get('common.error.text'));
    }
  };

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderCourseList = () => {
    const dateText = `${I18n.get('viesco-register-date')} ${moment().format('DD MMMM YYYY')}`;
    return (
      <>
        <SmallBoldText style={styles.dateText}>{dateText}</SmallBoldText>
        <FlatList
          data={props.courses}
          renderItem={({ item }) => <CallCard course={item} onPress={() => openCall(item)} />}
          keyExtractor={item => item.id + item.startDate}
          refreshControl={
            <RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={() => refresh()} />
          }
          ListEmptyComponent={<EmptyScreen svgImage="empty-absences" title={I18n.get('viesco-no-register-today')} />}
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
        return renderCourseList();
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
      <StructurePicker />
      {renderPage()}
    </PageView>
  );
};

export default connect(
  (state: IGlobalState) => {
    const presencesState = moduleConfig.getState(state);
    const session = getSession();

    return {
      allowMultipleSlots: presencesState.allowMultipleSlots.data,
      courses: presencesState.courses.data.filter(course => course.allowRegister === true),
      initialLoadingState: presencesState.courses.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      registerPreference: presencesState.registerPreference.data,
      session,
      structureId: getSelectedStructure(state),
      teacherId: session?.user.id,
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        fetchCourses: tryActionLegacy(
          fetchPresencesCoursesAction,
          undefined,
          true,
        ) as unknown as PresencesCourseListScreenPrivateProps['fetchCourses'],
        fetchEventReasons: tryActionLegacy(
          fetchPresencesEventReasonsAction,
          undefined,
          true,
        ) as unknown as PresencesCourseListScreenPrivateProps['fetchEventReasons'],
        fetchMultipleSlotsSetting: tryActionLegacy(
          fetchPresencesMultipleSlotSettingAction,
          undefined,
          true,
        ) as unknown as PresencesCourseListScreenPrivateProps['fetchMultipleSlotsSetting'],
        fetchRegisterPreference: tryActionLegacy(
          fetchPresencesRegisterPreferenceAction,
          undefined,
          true,
        ) as unknown as PresencesCourseListScreenPrivateProps['fetchRegisterPreference'],
      },
      dispatch,
    ),
)(PresencesCourseListScreen);
