import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Viewport } from '@skele/components';
import * as React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/empty-screens';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import { PageView } from '~/framework/components/page';
import { HeadingSText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import {
  deleteMailsAction,
  moveMailsToFolderAction,
  moveMailsToInboxAction,
  restoreMailsToFolderAction,
  restoreMailsToInboxAction,
  toggleReadAction,
  trashMailsAction,
} from '~/framework/modules/conversation/actions/mail';
import { clearMailContentAction, fetchMailContentAction } from '~/framework/modules/conversation/actions/mailContent';
import { FooterButton, HeaderMail, RenderPJs } from '~/framework/modules/conversation/components/MailContentItems';
import moduleConfig from '~/framework/modules/conversation/module-config';
import { ConversationNavigationParams, conversationRouteNames } from '~/framework/modules/conversation/navigation';
import { DraftType } from '~/framework/modules/conversation/screens/ConversationNewMail';
import MoveModal from '~/framework/modules/conversation/screens/MoveToFolderModal';
import { getMailContentState } from '~/framework/modules/conversation/state/mailContent';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { tryActionLegacy } from '~/framework/util/redux/actions';
import { Trackers } from '~/framework/util/tracker';
import { PageContainer } from '~/ui/ContainerContent';
import HtmlContentView from '~/ui/HtmlContentView';
import { Loading } from '~/ui/Loading';

export interface ConversationMailContentScreenNavigationParams {
  currentFolder: string;
  isTrashed: boolean;
  mailId: string;
  subject: string;
}
interface ConversationMailContentScreenEventProps {
  fetchMailContent: (mailId: string) => void;
  clearContent: () => void;
  toggleRead: (mailIds: string[], read: boolean) => void;
  trashMails: (mailIds: string[]) => void;
  deleteMails: (mailIds: string[]) => void;
  moveToFolder: (mailIds: string[], folderId: string) => void;
  moveToInbox: (mailIds: string[]) => void;
  restoreToFolder: (mailIds: string[], folderId: string) => void;
  restoreToInbox: (mailIds: string[]) => void;
}
interface ConversationMailContentScreenDataProps {
  dispatch: ThunkDispatch<any, any, any>;
  isPristine: boolean;
  isFetching: boolean;
  error?: Error;
  mail: any;
}
export type ConversationMailContentScreenProps = ConversationMailContentScreenEventProps &
  ConversationMailContentScreenDataProps &
  NativeStackScreenProps<ConversationNavigationParams, typeof conversationRouteNames.mailContent>;

interface ConversationMailContentScreenState {
  mailId: string;
  showModal: boolean;
  showHeaderSubject: boolean;
  htmlError: boolean;
}

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<
  ConversationNavigationParams,
  typeof conversationRouteNames.mailContent
>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    backButtonTestID: 'message-read-back',
  }),
});

const styles = StyleSheet.create({
  containerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: UI_SIZES.elements.tabbarHeight,
  },
  footerAreaView: {
    backgroundColor: theme.ui.background.card,
    borderTopColor: theme.ui.border.listItem,
    borderTopWidth: 1,
  },
  mailContentContainer: { flexGrow: 1, padding: UI_SIZES.spacing.small, backgroundColor: theme.ui.background.card },
  scrollView: { flex: 1 },
});

class MailContentScreen extends React.PureComponent<ConversationMailContentScreenProps, ConversationMailContentScreenState> {
  _subjectRef?: React.Ref<any> = undefined;

  constructor(props) {
    super(props);
    const { route } = this.props;
    this.state = {
      mailId: route.params.mailId,
      showModal: false,
      showHeaderSubject: false,
      htmlError: false,
    };
  }

  public componentDidMount() {
    const { error, route, navigation, isFetching, clearContent, fetchMailContent } = this.props;
    const { htmlError, showHeaderSubject } = this.state;
    const currentFolder = route.params.currentFolder;
    const isCurrentFolderTrash = currentFolder === 'trash';
    const isCurrentFolderSentOrDrafts = currentFolder === 'sendMessages' || currentFolder === 'drafts';
    const popupActionsMenu = [
      {
        title: I18n.get('conversation-mailcontent-markunread'),
        action: () => this.markAsRead(),
        icon: {
          ios: 'eye.slash',
          android: 'ic_visibility_off',
        },
      },
      {
        title: I18n.get(isCurrentFolderTrash ? 'conversation-mailcontent-restore' : 'conversation-mailcontent-move'),
        action: () => this.showModal(),
        icon: {
          ios: `${isCurrentFolderTrash ? 'arrow.uturn.backward.circle' : 'arrow.up.square'}`,
          android: `${isCurrentFolderTrash ? 'ic_restore' : 'ic_move_to_inbox'}`,
        },
      },
      deleteAction({ action: () => this.delete() }),
    ];
    navigation.setOptions({
      headerTitle: navBarTitle(showHeaderSubject ? route.params.subject : ''),
      // React Navigation 6 uses this syntax to setup nav options
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        isFetching || error || htmlError ? undefined : (
          <PopupMenu
            actions={
              isCurrentFolderTrash
                ? popupActionsMenu.splice(1, 2)
                : isCurrentFolderSentOrDrafts
                  ? popupActionsMenu.splice(2, 1)
                  : popupActionsMenu
            }>
            <NavBarAction icon="ui-options" testID="message-read-settings" />
          </PopupMenu>
        ),
    });
    clearContent();
    fetchMailContent(route.params.mailId);
  }

  public componentDidUpdate() {
    const { clearContent, fetchMailContent, route } = this.props;
    const { mailId } = this.state;
    if (route.params.mailId !== mailId) {
      clearContent();
      fetchMailContent(route.params.mailId);
      this.setState({ mailId: route.params.mailId });
    }
  }

  public showModal = () => {
    this.setState({
      showModal: true,
    });
  };

  public closeModal = () => {
    this.setState({
      showModal: false,
    });
  };

  mailMoved = () => {
    const { navigation } = this.props;
    navigation.dispatch(CommonActions.goBack());
    Toast.showInfo(I18n.get('conversation-maillist-messagemoved'));
  };

  markAsRead = async () => {
    const { toggleRead, mail, navigation } = this.props;
    await toggleRead([mail.id], false);
    navigation.dispatch(CommonActions.goBack());
  };

  move = () => {
    const { moveToInbox, mail } = this.props;
    moveToInbox([mail.id]);
  };

  delete = async () => {
    const { deleteMails, trashMails, mail, route, navigation } = this.props;
    const mailId = mail.id;
    const currentFolder = route.params.currentFolder;
    const isFolderDrafts = currentFolder === 'drafts';
    const isTrashed = route.params.isTrashed;
    const isTrashedOrDrafts = isTrashed || isFolderDrafts;
    try {
      if (isTrashed) {
        await deleteMails([mailId]);
      } else if (isFolderDrafts) {
        await trashMails([mailId]);
        await deleteMails([mailId]);
      } else await trashMails([mailId]);
      navigation.dispatch(CommonActions.goBack());
      Toast.showSuccess(
        I18n.get(isTrashedOrDrafts ? 'conversation-mailcontent-messagedeleted' : 'conversation-mailcontent-messagetrashed'),
      );
    } catch {
      // TODO: Manage error
    }
  };

  public render() {
    const { route, mail, error, isFetching, moveToFolder, moveToInbox, restoreToFolder, restoreToInbox } = this.props;
    const { showModal, htmlError } = this.state;
    const currentFolder = route.params.currentFolder;
    const ViewportAwareSubject = Viewport.Aware(View);

    return (
      <>
        <PageView>
          <PageContainer style={{ backgroundColor: theme.ui.background.page }}>
            {isFetching ? (
              <Loading />
            ) : error || htmlError ? (
              this.renderError()
            ) : (
              <>
                <Viewport.Tracker>
                  <ScrollView style={styles.scrollView} scrollEventThrottle={16}>
                    {mail.id && this.mailHeader()}
                    <ViewportAwareSubject
                      style={{ marginHorizontal: UI_SIZES.spacing.medium, backgroundColor: theme.ui.background.card }}
                      onViewportEnter={() => this.updateVisible(true)}
                      onViewportLeave={() => this.updateVisible(false)}
                      innerRef={ref => (this._subjectRef = ref)}>
                      <HeadingSText testID="message-read-title">{mail.subject}</HeadingSText>
                    </ViewportAwareSubject>
                    {mail.body !== undefined && this.mailContent()}
                  </ScrollView>
                </Viewport.Tracker>
                {this.mailFooter()}
              </>
            )}
          </PageContainer>
        </PageView>
        <MoveModal
          currentFolder={currentFolder}
          mail={mail}
          show={showModal}
          closeModal={this.closeModal}
          successCallback={this.mailMoved}
          moveToFolder={moveToFolder}
          moveToInbox={moveToInbox}
          restoreToFolder={restoreToFolder}
          restoreToInbox={restoreToInbox}
        />
      </>
    );
  }

  private mailFooter() {
    const { mail, navigation, route } = this.props;
    return (
      <SafeAreaView style={styles.footerAreaView}>
        <View style={styles.containerFooter}>
          <FooterButton
            icon="reply"
            text={I18n.get('conversation-mailcontent-reply')}
            onPress={() => {
              if (route.params.currentFolder === 'sendMessages')
                Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Outbox - Mail - Répondre');
              else Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Inbox/Dossier/Corbeille - Mail - Répondre');
              navigation.navigate(conversationRouteNames.newMail, {
                type: DraftType.REPLY,
                mailId: mail.id,
                currentFolder: route.params.currentFolder,
              });
            }}
            testID="message-read-reply"
          />
          <FooterButton
            icon="reply_all"
            text={I18n.get('conversation-mailcontent-replyall')}
            onPress={() => {
              if (route.params.currentFolder === 'sendMessages')
                Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Outbox - Mail - Répondre à tous');
              else Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Inbox/Dossier/Corbeille - Mail - Répondre à tous');
              navigation.navigate(conversationRouteNames.newMail, {
                type: DraftType.REPLY_ALL,
                mailId: mail.id,
                currentFolder: route.params.currentFolder,
              });
            }}
            testID="message-read-reply-all"
          />
          <FooterButton
            icon="forward"
            text={I18n.get('conversation-mailcontent-forward')}
            onPress={() => {
              if (route.params.currentFolder === 'sendMessages')
                Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Outbox - Mail - Transférer');
              else Trackers.trackEventOfModule(moduleConfig, 'Ecrire un mail', 'Inbox/Dossier/Corbeille - Mail - Transférer');
              navigation.navigate(conversationRouteNames.newMail, {
                type: DraftType.FORWARD,
                mailId: mail.id,
              });
            }}
            testID="message-read-reply-transfer"
          />
        </View>
      </SafeAreaView>
    );
  }

  private updateVisible(isVisible: boolean) {
    const { showHeaderSubject } = this.state;
    if (showHeaderSubject && isVisible) this.setState({ showHeaderSubject: false });
    else if (!showHeaderSubject && !isVisible) this.setState({ showHeaderSubject: true });
  }

  private mailContent() {
    const { mail, dispatch } = this.props;
    return (
      <View style={styles.mailContentContainer}>
        {mail.body !== undefined && (
          <HtmlContentView
            testID="message-read-content"
            onHtmlError={() => this.setState({ htmlError: true })}
            html={mail.body}
            opts={{ selectable: true }}
          />
        )}
        <View style={{ marginTop: UI_SIZES.spacing.medium }} testID="message-read-attachments" />
        {mail.attachments && mail.attachments.length > 0 && (
          <RenderPJs attachments={mail.attachments} mailId={mail.id} dispatch={dispatch} />
        )}
      </View>
    );
  }

  private mailHeader() {
    const { mail, route } = this.props;
    const currentFolder = route.params.currentFolder;
    return <HeaderMail mailInfos={mail} currentFolder={currentFolder} />;
  }

  private renderError() {
    return <EmptyContentScreen />;
  }
}

const mapStateToProps: (state: IGlobalState) => any = state => {
  const { isPristine, isFetching, data, error } = getMailContentState(state);

  return {
    isPristine,
    isFetching,
    error,
    mail: data,
  };
};

const mapDispatchToProps: (dispatch: any) => any = dispatch => {
  return {
    ...bindActionCreators(
      {
        fetchMailContent: fetchMailContentAction,
        clearContent: clearMailContentAction,
        toggleRead: tryActionLegacy(toggleReadAction, (mailIds, read) => [
          moduleConfig,
          'Marquer lu/non-lu',
          `Mail - Options - Marquer ${read ? 'lu' : 'non-lu'}`,
        ]),
        trashMails: tryActionLegacy(trashMailsAction, [moduleConfig, 'Supprimer', `Mail - Options - Mettre à la corbeille`]),
        deleteMails: tryActionLegacy(deleteMailsAction, [moduleConfig, 'Supprimer', `Mail - Options - Supprimer définitivement`]),
        moveToFolder: tryActionLegacy(moveMailsToFolderAction, [
          moduleConfig,
          'Déplacer',
          'Inbox/Dossier - Mail - Options - Déplacer',
        ]),
        moveToInbox: tryActionLegacy(moveMailsToInboxAction, [
          moduleConfig,
          'Déplacer',
          'Inbox/Dossier - Mail - Options - Déplacer',
        ]),
        restoreToFolder: tryActionLegacy(restoreMailsToFolderAction, [
          moduleConfig,
          'Restaurer',
          'Corbeille - Mail - Options - Restaurer',
        ]),
        restoreToInbox: tryActionLegacy(restoreMailsToInboxAction, [
          moduleConfig,
          'Restaurer',
          'Corbeille - Mail - Options - Restaurer',
        ]),
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MailContentScreen);
