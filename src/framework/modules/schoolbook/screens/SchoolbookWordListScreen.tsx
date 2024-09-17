/**
 * Schoolbook word list
 */
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import UserList from '~/framework/components/UserList';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import FlatList from '~/framework/components/list/flat-list';
import { LoadingIndicator } from '~/framework/components/loading';
import { linkAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import { AccountType, AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { SchoolbookWordSummaryCard } from '~/framework/modules/schoolbook/components/SchoolbookWordSummaryCard';
import { SchoolbookNavigationParams, schoolbookRouteNames } from '~/framework/modules/schoolbook/navigation';
import {
  IChildrenWithUnacknowledgedWordsCount,
  IStudentAndParentWord,
  IStudentAndParentWordList,
  ITeacherWord,
  ITeacherWordList,
} from '~/framework/modules/schoolbook/reducer';
import { getSchoolbookWorkflowInformation } from '~/framework/modules/schoolbook/rights';
import { schoolbookService } from '~/framework/modules/schoolbook/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { openUrl } from '~/framework/util/linking';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';
import { removeFirstWord } from '~/framework/util/string';

//FIXME: create/move to styles.ts
const styles = {
  schoolbookWordListContentContainer: { flexGrow: 1 },
};

// TYPES ==========================================================================================

export interface ISchoolbookWordListScreenDataProps {
  initialLoadingState: AsyncPagedLoadingState;
  session?: AuthLoggedAccount;
}
export type ISchoolbookWordListScreenProps = ISchoolbookWordListScreenDataProps &
  NativeStackScreenProps<SchoolbookNavigationParams, typeof schoolbookRouteNames.home>;

// HEADER =====================================================================================

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<SchoolbookNavigationParams, typeof schoolbookRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('schoolbook-wordlist-appname'),
  }),
  headerRight: undefined,
});

// COMPONENT ======================================================================================

const SchoolbookWordListScreen = (props: ISchoolbookWordListScreenProps) => {
  const session = props.session;
  const userId = session?.user?.id;
  const userType = session?.user?.type;
  const isTeacher = userType === AccountType.Teacher || userType === AccountType.Personnel;
  const isParent = userType === AccountType.Relative;
  // add isTeacher bc relative have right in session.rights.authorizedActions and we don't want to display context menu for them
  const hasSchoolbookWordCreationRights = session && getSchoolbookWorkflowInformation(session).create && isTeacher;

  // EVENTS =====================================================================================

  const [schoolbookWords, setSchoolbookWords] = React.useState(
    isParent ? ({} as { [key: string]: IStudentAndParentWordList }) : ([] as ITeacherWordList | IStudentAndParentWordList),
  );
  const [children, setChildren] = React.useState([] as IChildrenWithUnacknowledgedWordsCount);
  const [selectedChildId, setSelectedChildId] = React.useState('');
  const [nextPageToFetch, setNextPageToFetch] = React.useState<number | { [key: string]: number }>(0);
  const [pagingSize, setPagingSize] = React.useState<number | undefined>(undefined);

  // Fetch a page of schoolbook words.
  // Auto-increment nextPageNumber unless `fromStart` is provided.
  // If `flushAfter` is also provided along `fromStart`, all content after the loaded page will be erased.
  const fetchPage = React.useCallback(
    async (fromStart?: boolean, flushAfter?: boolean, childId?: string) => {
      const studentId = isParent ? childId || selectedChildId : userId;
      if (!studentId) throw new Error('missing studentId');
      if (!session) throw new Error('missing session');
      const pageToFetch = fromStart ? 0 : isParent ? nextPageToFetch[studentId] : nextPageToFetch; // If page is not defined, automatically fetch the next page
      const newSchoolbookWords = isTeacher
        ? await schoolbookService.list.teacher(session, pageToFetch)
        : await schoolbookService.list.studentAndParent(session, pageToFetch, studentId);

      let computedPagingSize = pagingSize;
      if (!computedPagingSize) {
        setPagingSize(newSchoolbookWords.length);
        computedPagingSize = newSchoolbookWords.length;
      }
      if (computedPagingSize) {
        if (newSchoolbookWords.length) {
          setSchoolbookWords(prevState => {
            return isParent
              ? {
                  ...prevState,
                  [studentId]: [
                    ...(prevState[studentId]?.slice(0, (computedPagingSize as number) * pageToFetch) || []),
                    ...newSchoolbookWords,
                    ...(flushAfter ? [] : prevState[studentId].slice((computedPagingSize as number) * (pageToFetch + 1))),
                  ],
                }
              : [
                  ...(schoolbookWords ? schoolbookWords.slice(0, (computedPagingSize as number) * pageToFetch) : []),
                  ...newSchoolbookWords,
                  ...(flushAfter
                    ? []
                    : schoolbookWords
                      ? schoolbookWords.slice((computedPagingSize as number) * (pageToFetch + 1))
                      : []),
                ];
          });
        }
        const newNextPageToFetch = !fromStart
          ? newSchoolbookWords.length === 0 || newSchoolbookWords.length < computedPagingSize
            ? -1
            : pageToFetch + 1
          : flushAfter
            ? 1
            : undefined;
        if (newNextPageToFetch) {
          setNextPageToFetch(prevState => {
            return isParent
              ? {
                  ...prevState,
                  [studentId]: newNextPageToFetch,
                }
              : newNextPageToFetch;
          });
        }
        // Only increment pagecount when fromStart is not specified
        return newSchoolbookWords;
      } else {
        setNextPageToFetch(prevState => {
          return isParent
            ? {
                ...prevState,
                [studentId]: -1,
              }
            : -1;
        });
      }
    },
    [isParent, isTeacher, nextPageToFetch, pagingSize, schoolbookWords, selectedChildId, session, userId],
  );

  const getChildIdWithNewestWord = (
    childrenWithUnacknowledgedWordsCount: IChildrenWithUnacknowledgedWordsCount,
    childrenWordLists: IStudentAndParentWordList[],
  ) => {
    const newestWordDates = childrenWordLists
      ?.map((childWordList, index) => ({
        index,
        sendingDate: childWordList && childWordList[0]?.sendingDate,
      }))
      ?.filter(newestWordDate => newestWordDate.sendingDate);
    const sortedNewestWordDates = newestWordDates?.sort((a, b) => moment(a.sendingDate).diff(b.sendingDate));
    const newestWordDate = sortedNewestWordDates && sortedNewestWordDates[sortedNewestWordDates.length - 1];
    const childWithNewestWord =
      childrenWithUnacknowledgedWordsCount && newestWordDate && childrenWithUnacknowledgedWordsCount[newestWordDate.index];
    const childIdWithNewestWord = childWithNewestWord?.id;
    return childIdWithNewestWord;
  };

  const fetchFromStart = React.useCallback(
    async (isFirstFetch?: boolean) => {
      if (isParent) {
        // Fetch children information for parent
        const fetchParentChildren = async () => {
          if (!userId) throw new Error('missing userId');
          const childrenByStructure = session.user.children;
          const allChildren = childrenByStructure?.map(structure => structure.children)?.flat();
          const formattedAllChildren = allChildren?.map(child => ({
            id: child.id,
            name: child.displayName && removeFirstWord(child.displayName),
          }));
          const wordsCountPromises = formattedAllChildren?.map(child =>
            schoolbookService.list.parentUnacknowledgedWordsCount(session, child.id),
          );
          const childrenUnacknowledgedWordsCount = wordsCountPromises && (await Promise.all(wordsCountPromises));
          const childrenWithUnacknowledgedWordsCount = formattedAllChildren?.map((child, index) => ({
            ...child,
            unacknowledgedWordsCount: (childrenUnacknowledgedWordsCount && childrenUnacknowledgedWordsCount[index]) || 0,
          }));
          if (childrenWithUnacknowledgedWordsCount) setChildren(childrenWithUnacknowledgedWordsCount);
          return childrenWithUnacknowledgedWordsCount;
        };

        const fetchedChildren = await fetchParentChildren();
        if (fetchedChildren?.length === 1) {
          const singleChildId = fetchedChildren[0]?.id;
          await fetchPage(true, true, singleChildId);
          if (isFirstFetch) setSelectedChildId(singleChildId);
        } else {
          const childrenWordListPromises = fetchedChildren?.map(fetchedChild => fetchPage(true, true, fetchedChild.id));
          const childrenWordLists =
            childrenWordListPromises && ((await Promise.all(childrenWordListPromises)) as IStudentAndParentWordList[]);
          const childToSelect =
            fetchedChildren &&
            ((childrenWordLists && getChildIdWithNewestWord(fetchedChildren, childrenWordLists)) || fetchedChildren[0]?.id);
          if (isFirstFetch && childToSelect) setSelectedChildId(childToSelect);
        }
      } else await fetchPage(true, true);
    },
    [fetchPage, isParent, session, userId],
  );

  const openSchoolbookWord = (schoolbookWordId: string) =>
    props.navigation.navigate(schoolbookRouteNames.details, {
      schoolbookWordId,
      studentId: selectedChildId,
    });

  // LOADER =====================================================================================

  // ToDo : Make this in a useLoadingState or <ContentLoader/>.

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchFromStart(true)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
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

  React.useEffect(() => {
    props.navigation.setOptions({
      // React Navigation 6 uses this syntax to setup nav options
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        hasSchoolbookWordCreationRights &&
        (loadingState === AsyncPagedLoadingState.DONE || loadingState === AsyncPagedLoadingState.REFRESH) ? (
          <PopupMenu
            actions={[
              linkAction({
                title: I18n.get('schoolbook-wordlist-wordcreate'),
                action: () => {
                  //TODO: get session.platform from redux
                  if (!session?.platform) {
                    return null;
                  }
                  const url = `${session?.platform!.url}/schoolbook#/list`;
                  openUrl(url);
                },
              }),
            ]}>
            <NavBarAction icon="ui-options" />
          </PopupMenu>
        ) : undefined,
    });
  }, [hasSchoolbookWordCreationRights, loadingState, props.navigation, session?.platform]);

  React.useEffect(() => {
    const init = () => {
      setLoadingState(AsyncPagedLoadingState.INIT);
      fetchFromStart(true)
        .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
        .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
    };
    const refreshSilent = () => {
      setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
      fetchFromStart()
        .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
        .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
    };
    const fetchOnNavigation = () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
      else refreshSilent();
    };
    const unsubscribe = props.navigation.addListener('focus', () => {
      fetchOnNavigation();
    });
    return unsubscribe;
  }, [fetchFromStart, hasSchoolbookWordCreationRights, loadingState, props.navigation, session?.platform]);

  // EMPTY SCREEN =================================================================================

  const renderEmpty = () => {
    return (
      <EmptyScreen
        svgImage="empty-schoolbook"
        title={I18n.get(
          hasSchoolbookWordCreationRights
            ? 'schoolbook-wordlist-emptyscreen-title'
            : 'schoolbook-wordlist-emptyscreen-title-nocreationrights',
        )}
        text={I18n.get(
          hasSchoolbookWordCreationRights
            ? 'schoolbook-wordlist-emptyscreen-text'
            : 'schoolbook-wordlist-emptyscreen-text-nocreationrights',
        )}
        {...(hasSchoolbookWordCreationRights
          ? {
              buttonText: I18n.get('schoolbook-wordlist-wordcreate'),
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
        style={{ padding: UI_SIZES.spacing.medium }}
        renderBadge={user => ({ badgeContent: user.unacknowledgedWordsCount, badgeColor: theme.ui.notificationBadge })}
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
    const isAllDataLoaded = isParent ? nextPageToFetch[selectedChildId] < 0 : nextPageToFetch < 0;
    return (
      <FlatList
        data={listData}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }: { item: IStudentAndParentWord | ITeacherWord }) => (
          <SchoolbookWordSummaryCard
            action={() => openSchoolbookWord(item.id?.toString())}
            userType={userType}
            userId={userId}
            {...item}
          />
        )}
        ListEmptyComponent={renderEmpty()}
        ListHeaderComponent={hasSeveralChildren ? renderChildrenList() : <View style={{ height: UI_SIZES.spacing.medium }} />}
        ListFooterComponent={loadingState === AsyncPagedLoadingState.FETCH_NEXT ? <LoadingIndicator withVerticalMargins /> : null}
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={() => refresh()} />}
        contentContainerStyle={styles.schoolbookWordListContentContainer}
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

  return <PageView>{renderPage()}</PageView>;
};

// MAPPING ========================================================================================

export default connect((state: IGlobalState) => ({
  session: getSession(),
  initialLoadingState: AsyncPagedLoadingState.PRISTINE,
}))(SchoolbookWordListScreen);
