/* eslint-disable react/no-unstable-nested-components */
import { DrawerNavigationOptions, DrawerScreenProps } from '@react-navigation/drawer';
import { HeaderBackButton } from '@react-navigation/elements';
import { UNSTABLE_usePreventRemove } from '@react-navigation/native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { ModalBoxHandle } from '~/framework/components/ModalBox';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen, EmptyScreen } from '~/framework/components/empty-screens';
import { LoadingIndicator } from '~/framework/components/loading';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView, pageGutterSize } from '~/framework/components/page';
import { SearchBar } from '~/framework/components/searchBar';
import SwipeableList from '~/framework/components/swipeableList';
import { BodyBoldText, TextFontStyle } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchZimbraMailsFromFolderAction } from '~/framework/modules/zimbra/actions';
import { MailListItem } from '~/framework/modules/zimbra/components/MailListItem';
import MoveMailsModal from '~/framework/modules/zimbra/components/modals/MoveMailsModal';
import { DraftType, IMail } from '~/framework/modules/zimbra/model';
import moduleConfig from '~/framework/modules/zimbra/module-config';
import { ZimbraNavigationParams, zimbraRouteNames } from '~/framework/modules/zimbra/navigation';
import { zimbraService } from '~/framework/modules/zimbra/service';
import { getFolderName } from '~/framework/modules/zimbra/utils/folderName';
import { navBarTitle } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import { ZimbraMailListScreenDispatchProps, ZimbraMailListScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: DrawerScreenProps<ZimbraNavigationParams, typeof zimbraRouteNames.mailList>): DrawerNavigationOptions =>
  ({
    headerTitle: navBarTitle(getFolderName(route.params.folderName), styles.navBarTitle),
    headerStyle: {
      backgroundColor: theme.palette.primary.regular,
    },
    headerTitleStyle: {
      ...TextFontStyle.Bold,
      color: theme.ui.text.inverse,
    },
    headerTitleAlign: 'center',
    headerTintColor: theme.ui.text.inverse,
    headerShadowVisible: true,
    freezeOnBlur: true,
  }) as DrawerNavigationOptions;

const ZimbraMailListScreen = (props: ZimbraMailListScreenPrivateProps) => {
  const [mails, setMails] = React.useState<Omit<IMail, 'body'>[]>(props.mails);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isFetchNextCallable, setFetchNextCallable] = React.useState<boolean>(true);
  const [query, setQuery] = React.useState<string>('');
  const [isSearchActive, setSearchActive] = React.useState<boolean>(false);
  const queryRefreshTimeout = React.useRef<NodeJS.Timeout>();
  const [selectedMails, setSelectedMails] = React.useState<string[]>([]);
  const listRef = React.useRef<SwipeListView<any>>(null);
  const moveModalRef = React.useRef<ModalBoxHandle>(null);

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchMails = async (page: number = 0, ignoreQuery?: boolean) => {
    try {
      const { folderPath } = props.route.params;

      if (page !== currentPage) setCurrentPage(page);
      let newMails = await props.tryFetchMailsFromFolder(folderPath, page, ignoreQuery ? undefined : query);
      setSearchActive(query.length > 0 && !ignoreQuery);
      if (page > 0) {
        newMails = mails.concat(newMails).filter((mail, index, array) => array.findIndex(m => m.id === mail.id) === index);
      } else {
        setFetchNextCallable(true);
      }
      setMails(newMails);
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchMails(0, true)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchMails(0)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchMails(0)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  const fetchNext = () => {
    setLoadingState(AsyncPagedLoadingState.FETCH_NEXT);
    fetchMails(currentPage + 1)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.FETCH_NEXT_FAILED));
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  React.useEffect(() => {
    setQuery('');
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.route.params.folderPath]);

  React.useEffect(() => {
    if (selectedMails.length) setSelectedMails([]);
    clearTimeout(queryRefreshTimeout.current);
    queryRefreshTimeout.current = setTimeout(() => {
      if ((!query.length || query.length > 2) && loadingState === AsyncPagedLoadingState.DONE) refresh();
    }, 500);
    return () => {
      clearTimeout(queryRefreshTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchNextPage = () => {
    if (isFetchNextCallable && loadingState === AsyncPagedLoadingState.DONE) {
      setFetchNextCallable(false);
      fetchNext();
    }
  };

  const openComposer = () => {
    const { navigation, quota } = props;

    if (quota.quota > 0 && quota.storage >= quota.quota) {
      return Alert.alert(I18n.get('zimbra-maillist-storagealert-title'), I18n.get('zimbra-maillist-storagealert-message'));
    }
    navigation.navigate(zimbraRouteNames.composer, {
      type: DraftType.NEW,
    });
  };

  const refreshListItem = async (id: string) => {
    try {
      const { session } = props;
      const index = mails.findIndex(m => m.id == id);

      if (!session) throw new Error();
      const mail = await zimbraService.mail.get(session, id, false);
      if (index === -1 || !mail) return;
      if (mail.parentId !== mails[index].parentId) {
        setMails(mails.filter(m => m.id !== id));
      } else {
        const newMails = mails.slice();
        newMails[index] = mail;
        setMails(newMails);
      }
    } catch {
      Toast.showError(I18n.get('zimbra-maillist-error-text'));
    }
  };

  const openMail = (mail: Omit<IMail, 'body'>) => {
    const { folderPath } = props.route.params;

    if (mail.state === 'DRAFT' && mail.systemFolder === 'DRAFT') {
      props.navigation.navigate(zimbraRouteNames.composer, {
        type: DraftType.DRAFT,
        mailId: mail.id,
        isTrashed: folderPath === '/Trash',
      });
    } else {
      props.navigation.navigate(zimbraRouteNames.mail, {
        folderPath,
        id: mail.id,
        subject: mail.subject,
        onNavigateBack: () => refreshListItem(mail.id),
      });
    }
  };

  const selectMail = (mail: Omit<IMail, 'body'>) => {
    if (selectedMails.includes(mail.id)) {
      setSelectedMails(selectedMails.filter(id => id !== mail.id));
    } else {
      setSelectedMails(selected => [...selected, mail.id]);
    }
  };

  const onPressMail = (mail: Omit<IMail, 'body'>) => {
    if (selectedMails.length) {
      selectMail(mail);
    } else {
      openMail(mail);
    }
  };

  const updateQuery = (value: string) => setQuery(value);

  const searchMails = () => {
    if (query.length > 0 && query.length < 3) {
      return Toast.showError(I18n.get('zimbra-maillist-searchbar-lengtherror'));
    }
    refresh();
  };

  const getIsSelectedMailUnread = (): boolean => {
    return mails.some(mail => selectedMails.includes(mail.id) && mail.unread === true);
  };

  const markMailsAsUnread = async (ids: string[], unread: boolean) => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      await zimbraService.mails.toggleUnread(session, ids, unread);
      setSelectedMails([]);
      setMails(
        mails.map(mail => ({
          ...mail,
          unread: ids.includes(mail.id) ? unread : mail.unread,
        })),
      );
    } catch {
      Toast.showError(I18n.get('zimbra-maillist-error-text'));
    }
  };

  const trashMails = async (ids: string[]) => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      await zimbraService.mails.trash(session, ids);
      setSelectedMails([]);
      setMails(mails.filter(mail => !ids.includes(mail.id)));
      Toast.showSuccess(I18n.get(ids.length > 1 ? 'zimbra-maillist-mails-trashed' : 'zimbra-maillist-mail-trashed'));
    } catch {
      Toast.showError(I18n.get('zimbra-maillist-error-text'));
    }
  };

  const deleteMails = async (ids: string[]) => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      await zimbraService.mails.delete(session, ids);
      setSelectedMails([]);
      setMails(mails.filter(mail => !ids.includes(mail.id)));
      Toast.showSuccess(I18n.get(ids.length > 1 ? 'zimbra-maillist-mails-deleted' : 'zimbra-maillist-mail-deleted'));
    } catch {
      Toast.showError(I18n.get('zimbra-maillist-error-text'));
    }
  };

  const alertPermanentDeletion = (ids: string[]) => {
    Alert.alert(I18n.get('zimbra-maillist-deletealert-title'), I18n.get('zimbra-maillist-deletealert-message'), [
      {
        text: I18n.get('common-cancel'),
        style: 'default',
      },
      {
        text: I18n.get('common-delete'),
        onPress: () => deleteMails(ids),
        style: 'destructive',
      },
    ]);
  };

  const moveMailsCallback = () => {
    moveModalRef.current?.doDismissModal();
    setMails(mails.filter(mail => !selectedMails.includes(mail.id)));
    setSelectedMails([]);
  };

  const getDropdownActions = () => {
    return [
      {
        title: I18n.get('zimbra-maillist-menuactions-move'),
        action: () => moveModalRef.current?.doShowModal(),
        icon: {
          ios: 'arrow.up.square',
          android: 'ic_move_to_inbox',
        },
      },
      deleteAction({ action: () => trashMails(selectedMails) }),
    ];
  };

  const getNavBarOptions = (): Partial<NativeStackNavigationOptions> => {
    if (selectedMails.length) {
      const { folderPath } = props.route.params;
      return {
        headerLeft: ({ tintColor }) => (
          <View style={styles.navBarLeftContainer}>
            <HeaderBackButton labelVisible={false} tintColor={tintColor} onPress={() => setSelectedMails([])} />
            <BodyBoldText style={styles.navBarCountText}>{selectedMails.length}</BodyBoldText>
          </View>
        ),
        headerRight: () => (
          <View style={styles.navBarRightContainer}>
            {folderPath === '/Sent' || folderPath === '/Drafts' || folderPath === '/Trash' ? (
              <>
                {folderPath === '/Drafts' ? (
                  <View style={styles.rightMargin}>
                    <NavBarAction icon="ui-folderMove" onPress={() => moveModalRef.current?.doShowModal()} />
                  </View>
                ) : null}
                {folderPath === '/Trash' ? (
                  <View style={styles.rightMargin}>
                    <NavBarAction icon="ui-restore" onPress={() => moveModalRef.current?.doShowModal()} />
                  </View>
                ) : null}
                <NavBarAction
                  icon="ui-delete"
                  onPress={() => (folderPath === '/Trash' ? alertPermanentDeletion(selectedMails) : trashMails(selectedMails))}
                />
              </>
            ) : (
              <>
                <View style={styles.rightMargin}>
                  <NavBarAction
                    icon={getIsSelectedMailUnread() ? 'ui-mailRead' : 'ui-mailUnread'}
                    onPress={() => markMailsAsUnread(selectedMails, !getIsSelectedMailUnread())}
                  />
                </View>
                <PopupMenu actions={getDropdownActions()}>
                  <NavBarAction icon="ui-options" />
                </PopupMenu>
              </>
            )}
          </View>
        ),
      };
    }
    return {
      headerLeft: undefined,
      headerRight: [AsyncPagedLoadingState.INIT_FAILED, AsyncPagedLoadingState.RETRY].includes(loadingState)
        ? undefined
        : () => (
            <View style={styles.navBarRightContainer}>
              <NavBarAction icon="ui-write" onPress={openComposer} />
            </View>
          ),
    };
  };

  React.useEffect(() => {
    const { navigation } = props;
    navigation.setOptions(getNavBarOptions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMails.length, props.quota]);

  const renderEmpty = () => {
    return isSearchActive ? (
      <EmptyScreen
        svgImage="empty-search"
        title={I18n.get('zimbra-maillist-emptyscreen-title-search')}
        customStyle={styles.emptyListContainer}
      />
    ) : (
      <EmptyScreen
        svgImage="empty-conversation"
        title={I18n.get('zimbra-maillist-emptyscreen-title-default')}
        text={I18n.get('zimbra-maillist-emptyscreen-text')}
        customStyle={styles.emptyListContainer}
      />
    );
  };

  const renderError = () => {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={reload} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderMailList = () => {
    const { folderPath } = props.route.params;
    return (
      <>
        <SwipeableList
          ref={listRef}
          data={mails}
          extraData={mails}
          keyExtractor={(item: Omit<IMail, 'body'>) => item.id}
          renderItem={({ item }) => (
            <MailListItem mail={item} isSelected={selectedMails.includes(item.id)} onPress={onPressMail} selectMail={selectMail} />
          )}
          refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.REFRESH} onRefresh={refresh} />}
          onScrollBeginDrag={() => setFetchNextCallable(true)}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <SearchBar
              query={query}
              containerStyle={styles.searchBarContainer}
              placeholder={I18n.get('zimbra-maillist-searchbar-placeholder')}
              onChangeQuery={updateQuery}
              onSearch={searchMails}
            />
          }
          ListFooterComponent={
            loadingState === AsyncPagedLoadingState.FETCH_NEXT ? (
              <LoadingIndicator customStyle={{ marginTop: UI_SIZES.spacing.big, marginBottom: pageGutterSize }} />
            ) : null
          }
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={styles.listContentContainer}
          swipeActionWidth={140}
          itemSwipeActionProps={({ item }) => ({
            left: folderPath.startsWith('/Inbox')
              ? [
                  {
                    action: async row => {
                      markMailsAsUnread([item.id], !item.unread);
                      row[item.key]?.closeRow();
                    },
                    actionColor: theme.palette.status.info.regular,
                    actionText: I18n.get(item.unread ? 'zimbra-maillist-markread' : 'zimbra-maillist-markunread'),
                    actionIcon: item.unread ? 'ui-eye' : 'ui-eyeSlash',
                  },
                ]
              : [],
            right: [
              {
                action: async row => {
                  if (folderPath === '/Trash') {
                    alertPermanentDeletion([item.id]);
                  } else {
                    trashMails([item.id]);
                  }
                  row[item.key]?.closeRow();
                },
                actionColor: theme.palette.status.failure.regular,
                actionText: I18n.get('zimbra-maillist-delete'),
                actionIcon: 'ui-trash',
              },
            ],
          })}
        />
        <MoveMailsModal
          ref={moveModalRef}
          folderPath={props.route.params.folderPath}
          folders={props.rootFolders}
          mailFolders={mails.filter(m => selectedMails.includes(m.id)).map(m => m.systemFolder)}
          mailIds={selectedMails}
          session={props.session}
          successCallback={moveMailsCallback}
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
      case AsyncPagedLoadingState.FETCH_NEXT:
      case AsyncPagedLoadingState.FETCH_NEXT_FAILED:
        return renderMailList();
      case AsyncPagedLoadingState.PRISTINE:
      case AsyncPagedLoadingState.INIT:
        return <LoadingIndicator />;
      case AsyncPagedLoadingState.INIT_FAILED:
      case AsyncPagedLoadingState.RETRY:
        return renderError();
    }
  };

  UNSTABLE_usePreventRemove(selectedMails.length > 0, ({ data }) => {
    setSelectedMails([]);
  });

  return <PageView style={styles.pageContainer}>{renderPage()}</PageView>;
};

export default connect(
  (state: IGlobalState) => {
    const zimbraState = moduleConfig.getState(state);
    const session = getSession();

    return {
      initialLoadingState: zimbraState.mails.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      mails: zimbraState.mails.data,
      quota: zimbraState.quota.data,
      rootFolders: zimbraState.rootFolders.data,
      session,
    };
  },
  dispatch =>
    bindActionCreators<ZimbraMailListScreenDispatchProps>(
      {
        tryFetchMailsFromFolder: tryAction(fetchZimbraMailsFromFolderAction),
      },
      dispatch,
    ),
)(ZimbraMailListScreen);
