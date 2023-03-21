/* eslint-disable react/no-unstable-nested-components */
import { DrawerNavigationOptions, DrawerScreenProps } from '@react-navigation/drawer';
import { HeaderBackButton } from '@react-navigation/elements';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import Toast from 'react-native-tiny-toast';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { ModalBoxHandle } from '~/framework/components/ModalBox';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import FlatList from '~/framework/components/flatList';
import { LoadingIndicator } from '~/framework/components/loading';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import { PageView, pageGutterSize } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import { TextFontStyle } from '~/framework/components/text';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchZimbraMailsFromFolderAction } from '~/framework/modules/zimbra/actions';
import { MailListItem } from '~/framework/modules/zimbra/components/MailListItem';
import { MailListSearchbar } from '~/framework/modules/zimbra/components/MailListSearchbar';
import {
  DEPRECATED_HeaderAction,
  DEPRECATED_HeaderIcon,
  DEPRECATED_HeaderTitle,
} from '~/framework/modules/zimbra/components/header';
import MoveMailsModal from '~/framework/modules/zimbra/components/modals/MoveMailsModal';
import { DraftType, IMail } from '~/framework/modules/zimbra/model';
import moduleConfig from '~/framework/modules/zimbra/module-config';
import { ZimbraNavigationParams, zimbraRouteNames } from '~/framework/modules/zimbra/navigation';
import { zimbraService } from '~/framework/modules/zimbra/service';
import { getFolderName } from '~/framework/modules/zimbra/utils/folderName';
import { NavBarAction } from '~/framework/navigation/navBar';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

import styles from './styles';
import { ZimbraMailListScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: DrawerScreenProps<ZimbraNavigationParams, typeof zimbraRouteNames.mailList>): DrawerNavigationOptions =>
  ({
    title: getFolderName(route.params.folderName),
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
  } as DrawerNavigationOptions);

const ZimbraMailListScreen = (props: ZimbraMailListScreenPrivateProps) => {
  const [mails, setMails] = React.useState<Omit<IMail, 'body'>[]>(props.mails);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isFetchNextCallable, setFetchNextCallable] = React.useState<boolean>(true);
  const [query, setQuery] = React.useState<string>('');
  const queryRefreshTimeout = React.useRef<NodeJS.Timeout>();
  const [selectedMails, setSelectedMails] = React.useState<string[]>([]);
  const moveModalRef = React.useRef<ModalBoxHandle>(null);

  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchMails = async (page: number = 0, flushList?: boolean, ignoreQuery?: boolean) => {
    try {
      const { folderPath } = props.route.params;

      if (page !== currentPage) setCurrentPage(page);
      let newMails = await props.fetchMailsFromFolder(folderPath, page, ignoreQuery ? undefined : query);
      if (flushList) {
        setFetchNextCallable(true);
      } else {
        newMails = mails.concat(newMails).filter((mail, index, array) => array.findIndex(m => m.id === mail.id) === index);
      }
      setMails(newMails);
    } catch {
      throw new Error();
    }
  };

  const init = () => {
    setLoadingState(AsyncPagedLoadingState.INIT);
    fetchMails(0, true, true)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
    fetchMails(0, true)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED));
  };

  const refresh = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH);
    fetchMails(0, true)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };

  /*const refreshSilent = () => {
    setLoadingState(AsyncPagedLoadingState.REFRESH_SILENT);
    fetchMails()
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.REFRESH_FAILED));
  };*/

  const fetchNext = () => {
    setLoadingState(AsyncPagedLoadingState.FETCH_NEXT);
    fetchMails(currentPage + 1)
      .then(() => setLoadingState(AsyncPagedLoadingState.DONE))
      .catch(() => setLoadingState(AsyncPagedLoadingState.FETCH_NEXT_FAILED));
  };

  const fetchOnNavigation = () => {
    if (loadingRef.current === AsyncPagedLoadingState.PRISTINE) init();
    //else refreshSilent();
  };

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      fetchOnNavigation();
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
      return Alert.alert(I18n.t('zimbra-quota-overflowTitle'), I18n.t('zimbra-quota-overflowText'));
    }
    navigation.navigate(zimbraRouteNames.composer, {
      type: DraftType.NEW,
    });
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

  const onGoBack = () => {
    if (selectedMails.length) return setSelectedMails([]);
  };

  const updateQuery = (value: string) => setQuery(value);

  const getSelectedMails = (): Omit<IMail, 'body'>[] => {
    return mails.filter(mail => selectedMails.includes(mail.id));
  };

  const getIsSelectedMailUnread = (): boolean => {
    return getSelectedMails().some(mail => mail.unread === true);
  };

  const markSelectedMailsAsUnread = async () => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      const isSelectedMailUnread = getIsSelectedMailUnread();
      await zimbraService.mails.toggleUnread(session, selectedMails, !isSelectedMailUnread);
      setSelectedMails([]);
    } catch {
      Toast.show(I18n.t('common.error.text'), { ...UI_ANIMATIONS.toast });
    }
  };

  const trashSelectedMails = async () => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      await zimbraService.mails.trash(session, selectedMails);
      setSelectedMails([]);
      Toast.show(I18n.t(selectedMails.length > 1 ? 'zimbra-messages-deleted' : 'zimbra-message-deleted'), {
        ...UI_ANIMATIONS.toast,
      });
    } catch {
      Toast.show(I18n.t('common.error.text'), { ...UI_ANIMATIONS.toast });
    }
  };

  const deleteSelectedMails = async () => {
    try {
      const { session } = props;

      if (!session) throw new Error();
      await zimbraService.mails.delete(session, selectedMails);
      setSelectedMails([]);
      Toast.show(I18n.t(selectedMails.length > 1 ? 'zimbra-messages-deleted' : 'zimbra-message-deleted'), {
        ...UI_ANIMATIONS.toast,
      });
    } catch {
      Toast.show(I18n.t('common.error.text'), { ...UI_ANIMATIONS.toast });
    }
  };

  const alertPermanentDeletion = () => {
    Alert.alert(I18n.t('zimbra-message-deleted-confirm'), I18n.t('zimbra-message-deleted-confirm-text'), [
      {
        text: I18n.t('common.cancel'),
        style: 'default',
      },
      {
        text: I18n.t('common.delete'),
        onPress: deleteSelectedMails,
        style: 'destructive',
      },
    ]);
  };

  const moveMailsCallback = () => {
    setSelectedMails([]);
    moveModalRef.current?.doDismissModal();
    refresh();
  };

  const getNavBarActions = () => {
    const { folderPath } = props.route.params;

    return folderPath === '/Trash'
      ? [
          { icon: 'delete-restore', onPress: () => moveModalRef.current?.doShowModal() },
          { icon: 'delete', onPress: alertPermanentDeletion },
        ]
      : [
          ...(folderPath !== '/Sent' && folderPath !== '/Drafts'
            ? [
                {
                  icon: getIsSelectedMailUnread() ? 'email-open' : 'email',
                  onPress: markSelectedMailsAsUnread,
                },
              ]
            : []),
          { icon: 'more_vert' },
        ];
  };

  const getDropdownActions = () => {
    const { folderPath } = props.route.params;

    return folderPath === '/Sent'
      ? [deleteAction({ action: trashSelectedMails })]
      : [
          {
            title: I18n.t('zimbra-move'),
            action: () => moveModalRef.current?.doShowModal(),
            icon: {
              ios: 'arrow.up.square',
              android: 'ic_move_to_inbox',
            },
          },
          deleteAction({ action: trashSelectedMails }),
        ];
  };

  const getNavBarOptions = (): Partial<NativeStackNavigationOptions> => {
    if (selectedMails.length) {
      const navBarActions = getNavBarActions();
      return {
        headerLeft: ({ tintColor }) => (
          <View style={styles.headerLeftContainer}>
            <HeaderBackButton tintColor={tintColor} onPress={onGoBack} />
            <DEPRECATED_HeaderTitle>{selectedMails.length}</DEPRECATED_HeaderTitle>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {navBarActions.map(action =>
              action.icon === 'more_vert' ? (
                <PopupMenu actions={getDropdownActions()}>
                  <DEPRECATED_HeaderIcon name={action.icon} iconSize={24} />
                </PopupMenu>
              ) : (
                <DEPRECATED_HeaderAction iconName={action.icon} iconSize={24} onPress={action.onPress} style={styles.rightMargin} />
              ),
            )}
          </View>
        ),
      };
    }
    return {
      headerLeft: undefined,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <NavBarAction iconName="ui-write" onPress={openComposer} />
        </View>
      ),
    };
  };

  React.useEffect(() => {
    const { navigation } = props;
    const options = getNavBarOptions();

    navigation.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMails.length]);

  const renderEmpty = () => {
    return (
      <EmptyScreen
        svgImage="empty-conversation"
        title={I18n.t('zimbra-empty-mailbox-title')}
        text={I18n.t('zimbra-empty-mailbox-text')}
        customStyle={styles.emptyListContainer}
      />
    );
  };

  const renderError = () => {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={() => reload()} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderMailList = () => {
    return (
      <>
        <FlatList
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
          ListHeaderComponent={<MailListSearchbar query={query} onChangeQuery={updateQuery} onSearch={refresh} />}
          ListFooterComponent={
            loadingState === AsyncPagedLoadingState.FETCH_NEXT ? (
              <LoadingIndicator customStyle={{ marginTop: UI_SIZES.spacing.big, marginBottom: pageGutterSize }} />
            ) : null
          }
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={styles.listContentContainer}
        />
        <MoveMailsModal
          ref={moveModalRef}
          folderPath={props.route.params.folderPath}
          folders={props.rootFolders}
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

  return <PageView>{renderPage()}</PageView>;
};

export default connect(
  (state: IGlobalState) => {
    const zimbraState = moduleConfig.getState(state);
    const session = getSession(state);

    return {
      initialLoadingState: zimbraState.mails.isPristine ? AsyncPagedLoadingState.PRISTINE : AsyncPagedLoadingState.DONE,
      mails: zimbraState.mails.data,
      quota: zimbraState.quota.data,
      rootFolders: zimbraState.rootFolders.data,
      session,
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        fetchMailsFromFolder: tryAction(
          fetchZimbraMailsFromFolderAction,
          undefined,
          true,
        ) as unknown as ZimbraMailListScreenPrivateProps['fetchMailsFromFolder'],
      },
      dispatch,
    ),
)(ZimbraMailListScreen);
