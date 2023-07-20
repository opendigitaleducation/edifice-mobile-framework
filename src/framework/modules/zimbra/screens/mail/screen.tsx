import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Alert, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import { ModalBoxHandle } from '~/framework/components/ModalBox';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { LoadingIndicator } from '~/framework/components/loading';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { fetchZimbraMailAction, fetchZimbraQuotaAction, fetchZimbraRootFoldersAction } from '~/framework/modules/zimbra/actions';
import { FooterButton, RenderPJs } from '~/framework/modules/zimbra/components/MailContentItems';
import { MailHeaders } from '~/framework/modules/zimbra/components/MailHeaders';
import MoveMailsModal from '~/framework/modules/zimbra/components/modals/MoveMailsModal';
import { DraftType } from '~/framework/modules/zimbra/model';
import moduleConfig from '~/framework/modules/zimbra/module-config';
import { ZimbraNavigationParams, zimbraRouteNames } from '~/framework/modules/zimbra/navigation';
import { zimbraService } from '~/framework/modules/zimbra/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import fileTransferService from '~/framework/util/fileHandler/service';
import { tryAction } from '~/framework/util/redux/actions';
import { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';
import HtmlContentView from '~/ui/HtmlContentView';

import styles from './styles';
import { ZimbraMailScreenDispatchProps, ZimbraMailScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ZimbraNavigationParams, typeof zimbraRouteNames.mail>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: '',
  }),
});

const ZimbraMailScreen = (props: ZimbraMailScreenPrivateProps) => {
  const moveModalRef = React.useRef<ModalBoxHandle>(null);
  const [loadingState, setLoadingState] = React.useState(props.initialLoadingState ?? AsyncPagedLoadingState.PRISTINE);
  const loadingRef = React.useRef<AsyncPagedLoadingState>();
  loadingRef.current = loadingState;
  // /!\ Need to use Ref of the state because of hooks Closure issue. @see https://stackoverflow.com/a/56554056/6111343

  const fetchContent = async () => {
    try {
      const { rootFolders } = props;
      const { id } = props.route.params;

      await props.tryFetchMail(id);
      await props.tryFetchQuota();
      if (!rootFolders.length) await props.tryFetchRootFolders();
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

  const reload = () => {
    setLoadingState(AsyncPagedLoadingState.RETRY);
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
    const unsubscribe = props.navigation.addListener('beforeRemove', () => {
      props.route.params.refreshList?.();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navigation]);

  const markAsUnread = async () => {
    try {
      const { navigation, session } = props;
      const { id } = props.route.params;

      if (!session) throw new Error();
      await zimbraService.mails.toggleUnread(session, [id], true);
      navigation.dispatch(CommonActions.goBack());
    } catch {
      Toast.showError(I18n.get('zimbra-mail-error-text'));
    }
  };

  const downloadAttachments = async () => {
    try {
      const { mail, session } = props;

      if (!mail || !mail.attachments.length || !session) throw new Error();
      for (const attachment of mail.attachments) {
        const syncedFile = await fileTransferService.downloadFile(session, attachment, {});
        await syncedFile.mirrorToDownloadFolder();
      }
      if (mail.attachments.length > 1) {
        Toast.showSuccess(I18n.get('zimbra-mail-download-success-count', { count: mail.attachments.length }));
      } else {
        Toast.showSuccess(I18n.get('zimbra-mail-download-success-name', { name: mail.attachments[0]?.filename }));
      }
    } catch {
      Toast.showError(I18n.get('zimbra-mail-download-error'));
    }
  };

  const trashMail = async () => {
    try {
      const { navigation, session } = props;
      const { id } = props.route.params;

      if (!session) throw new Error();
      await zimbraService.mails.trash(session, [id]);
      navigation.dispatch(CommonActions.goBack());
      Toast.showSuccess(I18n.get('zimbra-mail-mail-trashed'));
    } catch {
      Toast.showError(I18n.get('zimbra-mail-error-text'));
    }
  };

  const deleteMail = async () => {
    try {
      const { navigation, session } = props;
      const { id } = props.route.params;

      if (!session) throw new Error();
      await zimbraService.mails.delete(session, [id]);
      navigation.dispatch(CommonActions.goBack());
      Toast.showSuccess(I18n.get('zimbra-mail-mail-deleted'));
    } catch {
      Toast.showError(I18n.get('zimbra-mail-error-text'));
    }
  };

  const alertPermanentDeletion = () => {
    Alert.alert(I18n.get('zimbra-mail-deletealert-title'), I18n.get('zimbra-mail-deletealert-message'), [
      {
        text: I18n.get('common-cancel'),
        style: 'default',
      },
      {
        text: I18n.get('common-delete'),
        onPress: deleteMail,
        style: 'destructive',
      },
    ]);
  };

  const moveMailCallback = () => {
    const { navigation } = props;

    moveModalRef.current?.doDismissModal();
    navigation.dispatch(CommonActions.goBack());
  };

  const openComposer = (type: DraftType) => {
    const { navigation, quota } = props;
    const { id } = props.route.params;

    if (quota.quota > 0 && quota.storage >= quota.quota) {
      return Alert.alert(I18n.get('zimbra-mail-storagealert-title'), I18n.get('zimbra-mail-storagealert-message'));
    }
    navigation.navigate(zimbraRouteNames.composer, {
      type,
      mailId: id,
    });
  };

  const getMenuActions = () => {
    const { mail } = props;
    const { folderPath } = props.route.params;

    return [
      ...(folderPath.startsWith('/Inbox') || folderPath === '/Junk'
        ? [
            {
              title: I18n.get('zimbra-mail-menuactions-markunread'),
              action: markAsUnread,
              icon: {
                ios: 'eye.slash',
                android: 'ic_visibility_off',
              },
            },
            {
              title: I18n.get('zimbra-mail-menuactions-move'),
              action: () => moveModalRef.current?.doShowModal(),
              icon: {
                ios: 'arrow.up.square',
                android: 'ic_move_to_inbox',
              },
            },
          ]
        : []),
      ...(folderPath === '/Trash'
        ? [
            {
              title: I18n.get('zimbra-mail-menuactions-restore'),
              action: () => moveModalRef.current?.doShowModal(),
              icon: {
                ios: 'arrow.uturn.backward.circle',
                android: 'ic_restore',
              },
            },
          ]
        : []),
      ...(mail?.hasAttachment && Platform.OS === 'android'
        ? [
            {
              title: I18n.get('zimbra-mail-menuactions-downloadattachments'),
              action: downloadAttachments,
              icon: {
                ios: 'square.and.arrow.down',
                android: 'ic_download',
              },
            },
          ]
        : []),
      deleteAction({ action: folderPath === '/Trash' ? alertPermanentDeletion : trashMail }),
    ];
  };

  React.useEffect(() => {
    const { mail, navigation } = props;

    if (loadingState !== AsyncPagedLoadingState.DONE || !mail) return;
    const actions = getMenuActions();
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <PopupMenu actions={actions}>
          <NavBarAction icon="ui-options" />
        </PopupMenu>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  const renderError = () => {
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={loadingState === AsyncPagedLoadingState.RETRY} onRefresh={reload} />}>
        <EmptyContentScreen />
      </ScrollView>
    );
  };

  const renderFooter = () => {
    const { folderPath } = props.route.params;

    return folderPath !== '/Trash' ? (
      <View style={styles.footerContainer}>
        <FooterButton icon="reply" text={I18n.get('zimbra-mail-reply')} onPress={() => openComposer(DraftType.REPLY)} />
        <FooterButton icon="reply_all" text={I18n.get('zimbra-mail-replyall')} onPress={() => openComposer(DraftType.REPLY_ALL)} />
        <FooterButton icon="forward" text={I18n.get('zimbra-mail-forward')} onPress={() => openComposer(DraftType.FORWARD)} />
      </View>
    ) : null;
  };

  const renderMail = () => {
    const { mail } = props;

    if (!mail) return renderError();
    return (
      <>
        <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.contentContainer}>
          <View>
            <MailHeaders mail={mail} />
            {mail.hasAttachment ? <RenderPJs attachments={mail.attachments} /> : null}
            {mail.body ? (
              <HtmlContentView
                html={mail.body}
                opts={{ selectable: true }}
                onHtmlError={() => setLoadingState(AsyncPagedLoadingState.INIT_FAILED)}
                style={styles.bodyContainer}
              />
            ) : null}
          </View>
          {renderFooter()}
        </ScrollView>
        <MoveMailsModal
          ref={moveModalRef}
          folderPath={props.route.params.folderPath}
          folders={props.rootFolders}
          mailFolders={[mail.systemFolder]}
          mailIds={[mail.id]}
          session={props.session}
          successCallback={moveMailCallback}
        />
      </>
    );
  };

  const renderPage = () => {
    switch (loadingState) {
      case AsyncPagedLoadingState.DONE:
        return renderMail();
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
    const session = getSession();

    return {
      initialLoadingState: AsyncPagedLoadingState.PRISTINE,
      mail: zimbraState.mail.data,
      quota: zimbraState.quota.data,
      rootFolders: zimbraState.rootFolders.data,
      session,
    };
  },
  dispatch =>
    bindActionCreators<ZimbraMailScreenDispatchProps>(
      {
        tryFetchMail: tryAction(fetchZimbraMailAction),
        tryFetchQuota: tryAction(fetchZimbraQuotaAction),
        tryFetchRootFolders: tryAction(fetchZimbraRootFoldersAction),
      },
      dispatch,
    ),
)(ZimbraMailScreen);
