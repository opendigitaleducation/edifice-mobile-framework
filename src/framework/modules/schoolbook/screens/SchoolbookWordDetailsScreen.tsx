/**
 * Schoolbook word details
 */
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Platform, RefreshControl, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { InfoCommentField } from '~/framework/components/commentField';
import { EmptyContentScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { AccountType, AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import SchoolbookWordDetailsCard from '~/framework/modules/schoolbook/components/SchoolbookWordDetailsCard';
import { SchoolbookNavigationParams, schoolbookRouteNames } from '~/framework/modules/schoolbook/navigation';
import { ISchoolbookNotification } from '~/framework/modules/schoolbook/notif-handler';
import { IWordReport } from '~/framework/modules/schoolbook/reducer';
import { hasDeleteRight } from '~/framework/modules/schoolbook/rights';
import { schoolbookService, schoolbookUriCaptureFunction } from '~/framework/modules/schoolbook/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

// TYPES ==========================================================================================

export interface SchoolbookWordDetailsScreenDataProps {
  initialLoadingState: AsyncPagedLoadingState;
  session?: AuthLoggedAccount;
}
export interface SchoolbookWordDetailsScreenNavigationParams {
  notification?: ISchoolbookNotification;
  schoolbookWordId: string;
  studentId: string;
}
export type SchoolbookWordDetailsScreenProps = SchoolbookWordDetailsScreenDataProps &
  NativeStackScreenProps<SchoolbookNavigationParams, typeof schoolbookRouteNames.details>;

// HEADER =====================================================================================

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<SchoolbookNavigationParams, typeof schoolbookRouteNames.details>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('schoolbook-worddetails-appname'),
  }),
  headerRight: undefined,
});

// COMPONENT ======================================================================================

const SchoolbookWordDetailsScreen = (props: SchoolbookWordDetailsScreenProps) => {
  const session = props.session;
  const [schoolbookWordId, setSchoolbookWordId] = React.useState('');
  const [schoolbookWord, setSchoolbookWord] = React.useState({} as IWordReport);
  const [studentId, setStudentId] = React.useState('');
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const [isPublishingReply, setIsPublishingReply] = React.useState(false);
  const [isAcknowledgingWord, setIsAcknowledgingWord] = React.useState(false);
  const [infoComment, setInfoComment] = React.useState<InfoCommentField>({
    type: '',
    isPublication: false,
    changed: false,
    value: '',
  });
  const isSchoolbookWordRendered =
    loadingState === AsyncPagedLoadingState.DONE ||
    loadingState === AsyncPagedLoadingState.REFRESH_SILENT ||
    loadingState === AsyncPagedLoadingState.REFRESH_FAILED;
  const detailsCardRef: { current: any } = React.useRef();
  const userId = session?.user?.id;
  const userType = session?.user?.type;
  const isTeacher = userType === AccountType.Teacher || userType === AccountType.Personnel;
  const isParent = userType === AccountType.Relative;

  // EVENTS =====================================================================================

  const getSchoolbookWordIds = React.useCallback(async () => {
    const notification = props.route.params.notification;
    let ids;
    if (notification) {
      const resourceUri = notification?.resource?.uri;
      if (!resourceUri) {
        throw new Error('failed to call api (resourceUri is undefined)');
      }
      ids = schoolbookUriCaptureFunction(resourceUri) as Required<ReturnType<typeof schoolbookUriCaptureFunction>>;
      if (!ids.schoolbookWordId) {
        throw new Error(`failed to capture resourceUri "${resourceUri}": ${ids}`);
      }
    } else {
      const paramsSchoolbookWordId = props.route.params.schoolbookWordId;
      const paramsStudentId = props.route.params.studentId;
      if (!paramsSchoolbookWordId || (isParent && !paramsStudentId)) {
        throw new Error(`missing schoolbookWordId or studentId : ${{ paramsSchoolbookWordId, paramsStudentId }}`);
      }
      ids = { schoolbookWordId: paramsSchoolbookWordId, studentId: paramsStudentId };
    }
    setSchoolbookWordId(ids.schoolbookWordId);
    if (isParent) setStudentId(ids.studentId);
    return ids.schoolbookWordId;
  }, [isParent, props.route.params.notification, props.route.params.schoolbookWordId, props.route.params.studentId]);

  const fetchSchoolbookWord = React.useCallback(
    async wordId => {
      if (!session) throw new Error('missing session');
      const word = await schoolbookService.word.get(session, wordId);
      setSchoolbookWord(word);
    },
    [session],
  );

  const refreshSilent = React.useCallback(() => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    return getSchoolbookWordIds()
      .then(wordId => fetchSchoolbookWord(wordId))
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  }, [fetchSchoolbookWord, getSchoolbookWordIds]);

  const acknowledgeSchoolbookWord = async () => {
    try {
      setIsAcknowledgingWord(true);
      if (!session) throw new Error('missing session');
      await schoolbookService.word.acknowledge(session, schoolbookWordId, studentId);
      refreshSilent();
    } catch {
      setIsAcknowledgingWord(false);
      Toast.showError(I18n.get('schoolbook-worddetails-error-text'));
    }
  };

  const replyToSchoolbookWord = async (comment: string, commentId?: string) => {
    try {
      setIsPublishingReply(true);
      if (!session) throw new Error('missing session');
      if (commentId) {
        await schoolbookService.word.updateReply(session, schoolbookWordId, commentId, comment);
        // detailsCardRef?.current?.cardSelectedCommentFieldRef()?.setIsEditingFalse();
      } else {
        await schoolbookService.word.reply(session, schoolbookWordId, studentId, comment);
      }
      await refreshSilent();
      if (!commentId) {
        // Note #1: setTimeout is used to wait for the ScrollView height to update (after a response is added).
        // Note #2: scrollToEnd seems to become less precise once there is lots of data.
        setTimeout(() => detailsCardRef?.current?.scrollToEnd(), 1000);
      }
    } catch {
      Toast.showError(I18n.get('schoolbook-worddetails-error-text'));
    } finally {
      setIsPublishingReply(false);
    }
  };

  const openSchoolbookWordReport = () =>
    props.navigation.navigate(schoolbookRouteNames.report, {
      schoolbookWordId,
    });

  // LOADER =====================================================================================

  // ToDo : Make this in a useLoadingState or <ContentLoader/>.

  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    getSchoolbookWordIds()
      .then(wordId => fetchSchoolbookWord(wordId))
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  React.useEffect(() => {
    const deleteSchoolbookWord = async () => {
      try {
        if (!session) throw new Error('missing session');
        await schoolbookService.word.delete(session, schoolbookWordId);
        props.navigation.goBack();
      } catch {
        Toast.showError(I18n.get('schoolbook-worddetails-error-text'));
      }
    };
    const showDeleteSchoolbookWordAlert = () =>
      Alert.alert(I18n.get('schoolbook-worddetails-deletealert-title'), I18n.get('schoolbook-worddetails-deletealert-text'), [
        {
          text: I18n.get('common-cancel'),
          style: 'default',
        },
        {
          text: I18n.get('common-delete'),
          style: 'destructive',
          onPress: () => deleteSchoolbookWord(),
        },
      ]);
    const schoolbookWordOwnerId = schoolbookWord?.word?.ownerId;
    const isUserSchoolbookWordOwner = userId === schoolbookWordOwnerId;
    const schoolbookWordResource = { shared: schoolbookWord?.word?.shared, author: { userId: schoolbookWord?.word?.ownerId } };
    const hasSchoolbookWordDeleteRights = session && hasDeleteRight(schoolbookWordResource, session);
    const canDeleteSchoolbookWord = isUserSchoolbookWordOwner || hasSchoolbookWordDeleteRights;
    props.navigation.setOptions({
      // React Navigation 6 uses this syntax to setup nav options
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        isSchoolbookWordRendered && canDeleteSchoolbookWord ? (
          <PopupMenu actions={[deleteAction({ action: () => showDeleteSchoolbookWordAlert() })]}>
            <NavBarAction icon="ui-options" />
          </PopupMenu>
        ) : undefined,
    });
  }, [
    isSchoolbookWordRendered,
    props.navigation,
    schoolbookWord?.word?.ownerId,
    schoolbookWord?.word?.shared,
    schoolbookWordId,
    session,
    userId,
  ]);

  usePreventBack({
    title: I18n.get(
      infoComment.isPublication
        ? 'schoolbook-worddetails-confirmation-unsaved-publication'
        : 'schoolbook-worddetails-confirmation-unsaved-modification',
    ),
    text: I18n.get(
      infoComment.isPublication
        ? `schoolbook-worddetails-${infoComment.type}-confirmation-unsaved-publication`
        : `schoolbook-worddetails-${infoComment.type}-confirmation-unsaved-modification`,
    ),
    showAlert: infoComment.changed,
  });

  React.useEffect(() => {
    const init = () => {
      setLoadingState(AsyncPagedLoadingState.INIT);
      getSchoolbookWordIds()
        .then(wordId => fetchSchoolbookWord(wordId))
        .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
        .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
    };
    const fetchOnNavigation = () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
      else refreshSilent();
    };
    const unsubscribe = props.navigation.addListener('focus', () => {
      fetchOnNavigation();
    });
    return unsubscribe;
  }, [fetchSchoolbookWord, getSchoolbookWordIds, props.navigation, refreshSilent]);

  // ERROR ========================================================================================

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  // SCHOOLBOOK WORD DETAILS =========================================================================

  const onPublishReply = React.useCallback(
    (comment, commentId) => {
      replyToSchoolbookWord(comment, commentId);
    },
    [replyToSchoolbookWord],
  );

  const onEditComment = React.useCallback(data => {
    setInfoComment(data);
  }, []);

  const action = React.useCallback(
    () => (isTeacher ? openSchoolbookWordReport() : isParent ? acknowledgeSchoolbookWord() : undefined),
    [acknowledgeSchoolbookWord, isParent, isTeacher, openSchoolbookWordReport],
  );

  const renderSchoolbookWordDetails = () => {
    return (
      <SchoolbookWordDetailsCard
        ref={detailsCardRef}
        action={action}
        userType={userType}
        userId={userId}
        studentId={studentId}
        schoolbookWord={schoolbookWord}
        isPublishingReply={isPublishingReply}
        isAcknowledgingWord={isAcknowledgingWord}
        onPublishReply={onPublishReply}
        onEditComment={onEditComment}
      />
    );
  };

  // RENDER =======================================================================================

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH_SILENT:
      case AsyncPagedLoadingState.REFRESH_FAILED:
        return renderSchoolbookWordDetails();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  const PageComponent = Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;

  return (
    <>
      <PageComponent safeArea={false}>{renderPage()}</PageComponent>
    </>
  );
};

// MAPPING ========================================================================================

export default connect((state: IGlobalState) => ({
  session: getSession(),
  initialLoadingState: AsyncPagedLoadingState.PRISTINE,
}))(SchoolbookWordDetailsScreen);
