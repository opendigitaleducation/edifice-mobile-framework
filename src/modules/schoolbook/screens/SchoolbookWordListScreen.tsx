/**
 * Schoolbook word list
 */
import I18n from 'i18n-js';
import moment from 'moment';
import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { NavigationEventSubscription, NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import theme from '~/app/theme';
import UserList from '~/framework/components/UserList';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import FlatList from '~/framework/components/flatList';
import { LoadingIndicator } from '~/framework/components/loading';
import { PageView } from '~/framework/components/page';
import { computeRelativePath } from '~/framework/util/navigation';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';
import { IUserSession, UserType, getUserSession } from '~/framework/util/session';
import { SchoolbookWordSummaryCard } from '~/modules/schoolbook/components/SchoolbookWordSummaryCard';
import moduleConfig from '~/modules/schoolbook/moduleConfig';
import { userService } from '~/user/service';

import { IStudentAndParentWord, IStudentAndParentWordList, ITeacherWord, ITeacherWordList } from '../reducer';
import { getSchoolbookWorkflowInformation } from '../rights';
import { schoolbookService } from '../service';

// TYPES ==========================================================================================

export interface ISchoolbookWordListScreen_DataProps {
  initialLoadingState: AsyncPagedLoadingState;
  session: IUserSession;
}
export type ISchoolbookWordListScreen_Props = ISchoolbookWordListScreen_DataProps & NavigationInjectedProps;

// COMPONENT ======================================================================================

const SchoolbookWordListScreen = (props: ISchoolbookWordListScreen_Props) => {
  const session = props.session;
  const userId = session?.user?.id;
  const userType = session?.user?.type;
  const isTeacher = userType === UserType.Teacher;
  const isParent = userType === UserType.Relative;
  const hasSchoolbookWordCreationRights = getSchoolbookWorkflowInformation(session).create;
  let focusEventListener: NavigationEventSubscription;

  // LOADER =====================================================================================

  // ToDo : Make this in a useLoadingState.

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchFromStart()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchFromStart()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchFromStart()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchFromStart()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const fetchNextPage = () => {
    setLoadingState(AsyncPagedLoadingState.FETCH_NEXT);
    fetchPage()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.FETCH_NEXT_FAILED));
  };

  const fetchOnNavigation = () => {
    if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
    else refreshSilent();
  };

  React.useEffect(() => {
    // Note: 'didFocus' does not work when navigating from a notification, so we use this condition instead
    if (props.navigation.getParam('useNotification')) {
      fetchOnNavigation();
    }
    focusEventListener = props.navigation.addListener('didFocus', () => {
      fetchOnNavigation();
    });
    return () => {
      focusEventListener.remove();
    };
  }, []);

  // EVENTS =====================================================================================

  const [schoolbookWords, setSchoolbookWords] = React.useState(
    isParent ? ({} as { [key: string]: IStudentAndParentWordList }) : ([] as ITeacherWordList | IStudentAndParentWordList),
  );
  const [children, setChildren] = React.useState([] as { id: string; name: string; unacknowledgedWordsCount: number }[]);
  const [selectedChildId, setSelectedChildId] = React.useState('');
  const [nextPageToFetch_state, setNextPageToFetch] = React.useState<number | { [key: string]: number }>(0);
  const [pagingSize_state, setPagingSize] = React.useState<number | undefined>(undefined);

  // Fetch children information for parent.
  const fetchParentChildren = async () => {
    try {
      const childrenByStructure = await userService.getUserChildren(userId);
      const allChildren = childrenByStructure?.map(structure => structure.children)?.flat();
      const children = allChildren?.map(child => ({
        id: child.id,
        name: child.displayName?.split(' ')[1],
      }));
      const wordsCountPromises = children?.map(child => schoolbookService.list.parentUnacknowledgedWordsCount(session, child.id));
      const childrenUnacknowledgedWordsCount = wordsCountPromises && (await Promise.all(wordsCountPromises));
      const childrenWithUnacknowledgedWordsCount = children?.map((child, index) => ({
        ...child,
        unacknowledgedWordsCount: (childrenUnacknowledgedWordsCount && childrenUnacknowledgedWordsCount[index]) || 0,
      }));
      childrenWithUnacknowledgedWordsCount && setChildren(childrenWithUnacknowledgedWordsCount);
      return childrenWithUnacknowledgedWordsCount;
    } catch (e) {
      throw e;
    }
  };

  // Fetch a page of schoolbook words.
  // Auto-increment nextPageNumber unless `fromStart` is provided.
  // If `flushAfter` is also provided along `fromStart`, all content after the loaded page will be erased.
  const fetchPage = async (fromStart?: boolean, flushAfter?: boolean, childId?: string) => {
    try {
      const studentId = isParent ? childId || selectedChildId : userId;
      const pageToFetch = fromStart ? 0 : isParent ? nextPageToFetch_state[studentId] : nextPageToFetch_state; // If page is not defined, automatically fetch the next page
      const newSchoolbookWords = isTeacher
        ? await schoolbookService.list.teacher(session, pageToFetch)
        : await schoolbookService.list.studentAndParent(session, pageToFetch, studentId);

      let pagingSize = pagingSize_state;
      if (pagingSize === undefined) {
        setPagingSize(newSchoolbookWords.length);
        pagingSize = newSchoolbookWords.length;
      }
      if (pagingSize) {
        newSchoolbookWords.length &&
          setSchoolbookWords(prevState => {
            return isParent
              ? {
                  ...prevState,
                  [studentId]: [
                    ...(prevState[studentId]?.slice(0, pagingSize * pageToFetch) || []),
                    ...newSchoolbookWords,
                    ...(flushAfter ? [] : prevState[studentId].slice(pagingSize * (pageToFetch + 1))),
                  ],
                }
              : [
                  ...schoolbookWords?.slice(0, pagingSize * pageToFetch),
                  ...newSchoolbookWords,
                  ...(flushAfter ? [] : schoolbookWords?.slice(pagingSize * (pageToFetch + 1))),
                ];
          });

        const nextPageToFetch = !fromStart
          ? newSchoolbookWords.length === 0 || newSchoolbookWords.length < pagingSize
            ? -1
            : pageToFetch + 1
          : flushAfter
          ? 1
          : undefined;
        nextPageToFetch &&
          setNextPageToFetch(prevState => {
            return isParent
              ? {
                  ...prevState,
                  [studentId]: nextPageToFetch,
                }
              : nextPageToFetch;
          });
        // Only increment pagecount when fromStart is not specified
        return newSchoolbookWords;
      }
    } catch (e) {
      throw e;
    }
  };

  const fetchFromStart = async () => {
    if (isParent) {
      const isFirstFetch = loadingState === AsyncPagedLoadingState.INIT || loadingState === AsyncPagedLoadingState.RETRY;
      const fetchedChildren = await fetchParentChildren();
      if (fetchedChildren?.length === 1) {
        const singleChildId = fetchedChildren[0]?.id;
        await fetchPage(true, true, singleChildId);
        isFirstFetch && setSelectedChildId(singleChildId);
      } else {
        const childrenWordListPromises = fetchedChildren?.map(fetchedChild => fetchPage(true, true, fetchedChild.id));
        const childrenWordLists =
          childrenWordListPromises && ((await Promise.all(childrenWordListPromises)) as IStudentAndParentWordList[]);
        const childIdWithNewestWord =
          fetchedChildren && childrenWordLists && getChildIdWithNewestWord(fetchedChildren, childrenWordLists);
        isFirstFetch && childIdWithNewestWord && setSelectedChildId(childIdWithNewestWord);
      }
    } else await fetchPage(true, true);
  };

  const getChildIdWithNewestWord = (
    children: { id: string; name: string; unacknowledgedWordsCount: number }[],
    childrenWordLists: IStudentAndParentWordList[],
  ) => {
    const newestWordDates = childrenWordLists?.map((childWordList, index) => ({
      index,
      sendingDate: childWordList && childWordList[0]?.sendingDate,
    }));
    const sortedNewestWordDates = newestWordDates?.sort((a, b) => moment(a.sendingDate).diff(b.sendingDate));
    const newestWordDate = sortedNewestWordDates && sortedNewestWordDates[sortedNewestWordDates?.length - 1];
    const childWithNewestWord = children && newestWordDate && children[newestWordDate.index];
    const childIdWithNewestWord = childWithNewestWord?.id;
    return childIdWithNewestWord;
  };

  const openSchoolbookWord = (schoolbookWordId: string) =>
    props.navigation.navigate(computeRelativePath(`${moduleConfig.routeName}/details`, props.navigation.state), {
      schoolbookWordId,
      studentId: selectedChildId,
    });

  // HEADER =====================================================================================

  const navBarInfo = {
    title: I18n.t('schoolbook.appName'),
  };

  // EMPTY SCREEN =================================================================================

  const renderEmpty = () => {
    return (
      <EmptyScreen
        svgImage="empty-schoolbook"
        title={I18n.t(
          `schoolbook.schoolbookWordListScreen.emptyScreen.title${hasSchoolbookWordCreationRights ? '' : 'NoCreationRights'}`,
        )}
        text={I18n.t(
          `schoolbook.schoolbookWordListScreen.emptyScreen.text${hasSchoolbookWordCreationRights ? '' : 'NoCreationRights'}`,
        )}
        {...(hasSchoolbookWordCreationRights
          ? {
              buttonText: I18n.t('schoolbook.schoolbookWordListScreen.emptyScreen.button'),
              buttonUrl: '/schoolbook#/list',
            }
          : {})}
      />
    );
  };

  // ERROR ========================================================================================

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  // CHILDREN LIST ================================================================================

  const renderChildrenList = () => {
    return (
      <UserList
        data={children}
        renderBadge={user => ({ badgeContent: user.unacknowledgedWordsCount, badgeColor: theme.color.notificationBadge })}
        onSelect={id => setSelectedChildId(id)}
        selectedId={selectedChildId}
        horizontal
      />
    );
  };

  // SCHOOLBOOK WORD LIST =========================================================================

  const renderSchoolbookWordList = () => {
    const listData = isParent ? schoolbookWords[selectedChildId] : schoolbookWords;
    const hasSeveralChildren = children?.length > 1;
    const isAllDataLoaded = isParent ? nextPageToFetch_state[selectedChildId] < 0 : nextPageToFetch_state < 0;
    return (
      <FlatList
        data={listData}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }: { item: IStudentAndParentWord | ITeacherWord }) => (
          <SchoolbookWordSummaryCard
            action={() => openSchoolbookWord(item.id.toString())}
            userType={userType}
            userId={userId}
            {...item}
          />
        )}
        ListEmptyComponent={renderEmpty()}
        ListHeaderComponent={hasSeveralChildren ? renderChildrenList() : null}
        ListFooterComponent={loadingState === AsyncPagedLoadingState.FETCH_NEXT ? <LoadingIndicator withMargins /> : null}
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={() => refresh()} />}
        contentContainerStyle={{ flexGrow: 1 }}
        onEndReached={() => (isAllDataLoaded ? null : fetchNextPage())}
        onEndReachedThreshold={0.5}
      />
    );
  };

  // RENDER =======================================================================================

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
      case AsyncPagedLoadingState.REFRESH:
      case AsyncPagedLoadingState.REFRESH_FAILED:
      case AsyncPagedLoadingState.REFRESH_SILENT:
      case AsyncPagedLoadingState.FETCH_NEXT:
      case AsyncPagedLoadingState.FETCH_NEXT_FAILED:
        return renderSchoolbookWordList();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  return (
    <PageView navigation={props.navigation} navBarWithBack={navBarInfo}>
      {renderPage()}
    </PageView>
  );
};

// MAPPING ========================================================================================

export default connect(
  () => ({
    session: getUserSession(),
    initialLoadingState: AsyncPagedLoadingState.PRISTINE,
  }),
  dispatch => bindActionCreators({}, dispatch),
)(SchoolbookWordListScreen);
