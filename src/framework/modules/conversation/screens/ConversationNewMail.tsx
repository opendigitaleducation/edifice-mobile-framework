import { CommonActions, NavigationProp, ParamListBase, UNSTABLE_usePreventRemove, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import React from 'react';
import { Alert, AlertButton, Keyboard, Platform, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { LoadingIndicator } from '~/framework/components/loading';
import { DocumentPicked, cameraAction, documentAction, galleryAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import NavBarAction from '~/framework/components/navigation/navbar-action';
import NavBarActionsGroup from '~/framework/components/navigation/navbar-actions-group';
import { PageView } from '~/framework/components/page';
import Toast from '~/framework/components/toast';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { deleteMailsAction, trashMailsAction } from '~/framework/modules/conversation/actions/mail';
import { clearMailContentAction, fetchMailContentAction } from '~/framework/modules/conversation/actions/mailContent';
import {
  addAttachmentAction,
  deleteAttachmentAction,
  forwardMailAction,
  makeDraftMailAction,
  sendMailAction,
  updateDraftMailAction,
} from '~/framework/modules/conversation/actions/newMail';
import { fetchVisiblesAction } from '~/framework/modules/conversation/actions/visibles';
import NewMailComponent from '~/framework/modules/conversation/components/NewMail';
import moduleConfig from '~/framework/modules/conversation/module-config';
import { ConversationNavigationParams, conversationRouteNames } from '~/framework/modules/conversation/navigation';
import { ISearchUsers } from '~/framework/modules/conversation/service/newMail';
import { IMail, getMailContentState } from '~/framework/modules/conversation/state/mailContent';
import { handleRemoveConfirmNavigationEvent } from '~/framework/navigation/helper';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import { IDistantFile, LocalFile, SyncedFileWithId } from '~/framework/util/fileHandler';
import { IUploadCallbaks } from '~/framework/util/fileHandler/service';
import { Asset } from '~/framework/util/fileHandler/types';
import { isEmpty } from '~/framework/util/object';
import { Trackers } from '~/framework/util/tracker';

const styles = StyleSheet.create({
  title: { width: undefined },
});

export enum DraftType {
  NEW,
  DRAFT,
  REPLY,
  REPLY_ALL,
  FORWARD,
}

type NewMail = {
  to: ISearchUsers;
  cc: ISearchUsers;
  cci: ISearchUsers;
  subject: string;
  body: string;
  attachments: Omit<IDistantFile, 'url'>[];
};

export interface ConversationNewMailScreenNavigationParams {
  addGivenAttachment?: (file: Asset | DocumentPicked, sourceType: string) => void;
  currentFolder?: string;
  getGoBack?: () => void;
  getSendDraft?: () => void;
  mailId?: string;
  toUsers?: ISearchUsers;
  type: DraftType;
}

interface ConversationNewMailScreenEventProps {
  setup: () => void;
  sendMail: (mailDatas: object, draftId: string | undefined, inReplyTo: string) => void;
  forwardMail: (draftId: string, inReplyTo: string) => void;
  makeDraft: (mailDatas: object, inReplyTo: string, isForward: boolean) => Promise<string>;
  updateDraft: (mailId: string, mailDatas: object) => void;
  trashMessage: (mailId: string[]) => void;
  deleteMessage: (mailId: string[]) => void;
  addAttachment: (draftId: string, files: LocalFile, callbacks?: IUploadCallbaks) => Promise<SyncedFileWithId>;
  deleteAttachment: (draftId: string, attachmentId: string) => void;
  fetchMailContent: (mailId: string) => void;
  clearContent: () => void;
}

interface ConversationNewMailScreenDataProps {
  isFetching: boolean;
  mail: IMail;
  session: AuthLoggedAccount;
}

export type ConversationNewMailScreenProps = ConversationNewMailScreenEventProps &
  ConversationNewMailScreenDataProps &
  NativeStackScreenProps<ConversationNavigationParams, typeof conversationRouteNames.newMail>;

interface ConversationNewMailScreenState {
  id?: string;
  mail: NewMail;
  tempAttachment?: any;
  isPrefilling?: boolean;
  prevBody?: string;
  replyTo?: string;
  webDraftWarning: boolean;
  isSending: boolean;
}

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ConversationNavigationParams, typeof conversationRouteNames.newMail>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('conversation-newmail-newmessage'),
    titleStyle: styles.title,
  }),
});

const HandleBack = (props: { isSending: boolean; onBack: (a: () => void) => any }) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  UNSTABLE_usePreventRemove(!props.isSending, ({ data }) => {
    props.onBack?.(() => {
      handleRemoveConfirmNavigationEvent(data.action, navigation);
    });
  });
  return null;
};

class NewMailScreen extends React.PureComponent<ConversationNewMailScreenProps, ConversationNewMailScreenState> {
  constructor(props) {
    super(props);

    this.state = {
      mail: { to: [], cc: [], cci: [], subject: '', body: '', attachments: [] },
      prevBody: '',
      webDraftWarning: false,
      isSending: false,
    };
  }

  componentDidMount = () => {
    const { fetchMailContent, route, navigation, clearContent, setup } = this.props;
    const { id } = this.state;
    const draftType = route.params.type;
    const mailId = route.params.mailId;
    const toUsers = route.params.toUsers;
    navigation.setParams(this.navigationHeaderFunction);
    if (mailId) {
      this.setState({ isPrefilling: true });
      fetchMailContent(mailId);
    }
    if (toUsers) {
      this.setState(prevState => ({
        mail: { ...prevState.mail, to: toUsers },
      }));
    }
    if (draftType !== DraftType.DRAFT) {
      this.setState({ id: undefined });
    }
    clearContent();
    setup();
    if (mailId && !id && draftType === DraftType.DRAFT) {
      this.setState({ id: mailId });
    }
  };

  componentDidUpdate = async (prevProps: ConversationNewMailScreenProps) => {
    const { mail, navigation, route } = this.props;
    const { id, isSending, webDraftWarning } = this.state;
    const draftType = route.params.type;
    const isSavedDraft = draftType === DraftType.DRAFT;
    const addGivenAttachment = this.navigationHeaderFunction.addGivenAttachment;
    const sendDraft = this.navigationHeaderFunction.getSendDraft;

    navigation.setOptions({
      headerTitle: navBarTitle(
        I18n.get(isSavedDraft ? 'conversation-newmail-draft' : 'conversation-newmail-newmessage'),
        styles.title,
      ),
      // React Navigation 6 uses this syntax to setup nav options
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <NavBarActionsGroup
          elements={[
            {
              ...(addGivenAttachment ? (
                <PopupMenu
                  actions={[
                    cameraAction({ callback: addGivenAttachment }),
                    galleryAction({ callback: addGivenAttachment, multiple: true, synchrone: true }),
                    documentAction({ callback: addGivenAttachment }),
                  ]}>
                  <NavBarAction icon="ui-attachment" />
                </PopupMenu>
              ) : null),
            },
            {
              ...(sendDraft ? (
                isSending ? (
                  <LoadingIndicator small customColor={theme.ui.text.inverse} />
                ) : (
                  <NavBarAction onPress={sendDraft} icon="ui-send" />
                )
              ) : null),
            },
          ]}
        />
      ),
    });

    if (prevProps.mail !== mail) {
      const prefilledMailRet = this.getPrefilledMail();
      if (!prefilledMailRet) return;
      const { mail: prefilledMail, ...rest } = prefilledMailRet;
      if (!prefilledMail) return;
      this.setState(prevState => ({
        ...prevState,
        ...rest,
        mail: { ...prevState.mail, ...(prefilledMail as IMail) },
        isPrefilling: false,
      }));
    } else if (route.params.mailId && !id && route.params.type === DraftType.DRAFT)
      if ((route.params.type ?? DraftType.NEW) === DraftType.DRAFT && !webDraftWarning) {
        // Check if html tags are present in body
        const removeWrapper = (text: string) => {
          return text.replace(/^<div class="ng-scope mobile-application-wrapper">(.*)/, '$1').replace(/(.*)<\/div>$/, '$1');
        };
        let checkBody = removeWrapper(this.props.mail.body);
        checkBody = checkBody.split('<hr class="ng-scope">')[0];
        checkBody = checkBody.replace(/<\/?(div|br)\/?>/g, '');
        if (/<("[^"]*"|'[^']*'|[^'">])*>/.test(checkBody)) {
          this.setState({ webDraftWarning: true });
          Alert.alert(
            I18n.get('conversation-newmail-warning-webdraft-title'),
            I18n.get('conversation-newmail-warning-webdraft-text'),
            [
              {
                text: I18n.get('common-quit'),
                onPress: async () => {
                  this.props.navigation.goBack();
                },
                style: 'cancel',
              },
              {
                text: I18n.get('common-continue'),
                onPress: async () => {},
                style: 'default',
              },
            ],
          );
        }
      }
  };

  navigationHeaderFunction = {
    addGivenAttachment: async (file: Asset | DocumentPicked, sourceType: string) => {
      const actionName =
        'Rédaction mail - Insérer - Pièce jointe - ' +
        ({
          camera: 'Caméra',
          gallery: 'Galerie',
          document: 'Document',
        }[sourceType] ?? 'Source inconnue');
      try {
        await this.getAttachmentData(new LocalFile(file, { _needIOSReleaseSecureAccess: false }));
        Trackers.trackEventOfModule(moduleConfig, 'Ajouter une pièce jointe', actionName + ' - Succès');
      } catch {
        Toast.showError('pickfile-error-storageaccess');
        Trackers.trackEventOfModule(moduleConfig, 'Ajouter une pièce jointe', actionName + ' - Échec');
      }
    },
    getSendDraft: async () => {
      const { mail, tempAttachment } = this.state;
      if (isEmpty(mail.to) && isEmpty(mail.cc) && isEmpty(mail.cci)) {
        Keyboard.dismiss();
        Toast.showError(I18n.get('conversation-newmail-missingreceiver'));
        return;
      } else if (tempAttachment && tempAttachment !== null) {
        Keyboard.dismiss();
        Toast.showInfo(I18n.get('conversation-newmail-sendattachment-progress'));
        return;
      } else if (!mail.body || !mail.subject) {
        Keyboard.dismiss();
        Alert.alert(
          I18n.get(!mail.body ? 'conversation-newmail-missingbody-title' : 'conversation-newmail-missingsubject-title'),
          I18n.get(!mail.body ? 'conversation-newmail-missingbody-message' : 'conversation-newmail-missingsubject-message'),
          [
            {
              text: I18n.get('common-send'),
              onPress: () => this.sendDraft(),
            },
            {
              text: I18n.get('common-cancel'),
              style: 'cancel',
            },
          ],
        );
        return;
      }
      this.sendDraft();
    },
    getDeleteDraft: async () => {
      const { trashMessage, deleteMessage, navigation } = this.props;
      const { id } = this.state;
      if (id) {
        try {
          await trashMessage([id]);
          await deleteMessage([id]);
          navigation.goBack();
          Trackers.trackEventOfModule(moduleConfig, 'Supprimer', 'Rédaction mail - Supprimer le brouillon - Succès');
          Toast.showSuccess(I18n.get('conversation-newmail-messagedeleted'));
        } catch {
          Trackers.trackEventOfModule(moduleConfig, 'Supprimer', 'Rédaction mail - Supprimer le brouillon - Échec');
        }
      }
      navigation.goBack();
    },
    getGoBack: async backAction => {
      const { trashMessage, deleteMessage, route } = this.props;
      const { tempAttachment, mail, id } = this.state;
      const { to, cc, cci, subject, body, attachments } = mail;
      const mailId = route.params.mailId;
      const draftType = route.params.type;
      const isNewDraft = draftType === DraftType.NEW;
      const isSavedDraft = draftType === DraftType.DRAFT;
      const isUploadingAttachment = tempAttachment && tempAttachment !== null;
      const isDraftEmpty =
        to.length === 0 && cc.length === 0 && cci.length === 0 && subject === '' && body === '' && attachments.length === 0;

      if (isUploadingAttachment) {
        Keyboard.dismiss();
        Toast.showInfo(I18n.get('conversation-newmail-sendattachment-progress'));
      } else if (!isDraftEmpty) {
        const textToDisplay = {
          title: 'conversation-newmail-savedraft-title',
          text: isSavedDraft ? 'conversation-newmail-saveagaindraft-message' : 'conversation-newmail-savedraft-message',
        };
        const options = [
          ...(isSavedDraft
            ? [
                {
                  text: isSavedDraft ? I18n.get('conversation-newmail-deletedraft') : I18n.get('common-delete'),
                  onPress: async () => {
                    try {
                      if (id) {
                        await trashMessage([id]);
                        await deleteMessage([id]);
                      }
                      Trackers.trackEventOfModule(
                        moduleConfig,
                        'Ecrire un mail',
                        'Rédaction mail - Sortir - Supprimer le brouillon - Succès',
                      );
                    } catch {
                      Trackers.trackEventOfModule(
                        moduleConfig,
                        'Ecrire un mail',
                        'Rédaction mail - Sortir - Supprimer le brouillon - Échec',
                      );
                    }
                    backAction();
                  },
                  style: 'destructive',
                },
              ]
            : []),
          {
            text: isSavedDraft ? I18n.get('conversation-newmail-cancelmodifications') : I18n.get('common-delete'),
            onPress: async () => {
              try {
                if ((isNewDraft && id) || (!isNewDraft && id && id !== mailId)) {
                  await trashMessage([id]);
                  await deleteMessage([id]);
                }
                Trackers.trackEventOfModule(
                  moduleConfig,
                  'Ecrire un mail',
                  isSavedDraft
                    ? 'Rédaction mail - Sortir - Annuler les modifications - Succès'
                    : 'Rédaction mail - Sortir - Abandonner le brouillon - Succès',
                );
              } catch {
                Trackers.trackEventOfModule(
                  moduleConfig,
                  'Ecrire un mail',
                  isSavedDraft
                    ? 'Rédaction mail - Sortir - Annuler les modifications - Échec'
                    : 'Rédaction mail - Sortir - Abandonner le brouillon - Échec',
                );
              }
              backAction();
            },
            style: isSavedDraft ? 'default' : 'destructive',
          },
          {
            text: isSavedDraft ? I18n.get('conversation-newmail-savemodifications') : I18n.get('common-save'),
            onPress: async () => {
              try {
                await this.saveDraft();
                Trackers.trackEventOfModule(
                  moduleConfig,
                  'Ecrire un mail',
                  'Rédaction mail - Sortir - Sauvegarder le brouillon - Succès',
                );
              } catch {
                Trackers.trackEventOfModule(
                  moduleConfig,
                  'Ecrire un mail',
                  'Rédaction mail - Sortir - Sauvegarder le brouillon - Échec',
                );
              }
              backAction();
            },
            style: 'default',
          },
        ] as AlertButton[];
        Alert.alert(
          I18n.get(textToDisplay.title),
          I18n.get(textToDisplay.text),
          Platform.select({
            ios: [...options].reverse(),
            android: options,
          }),
        );
      } else {
        if ((isNewDraft && id) || (!isNewDraft && !isSavedDraft && id && id !== mailId)) {
          await trashMessage([id]);
          deleteMessage([id]);
        } else if (isSavedDraft) {
          await this.saveDraft();
        }
        backAction();
      }
    },
  };

  getPrefilledMail = () => {
    const { mail, route, session } = this.props;
    if (!mail || (mail as unknown as []).length === 0) return undefined;
    const draftType = route.params.type ?? DraftType.NEW;
    const getDisplayName = (id: string) => mail.displayNames.find(([userId]) => userId === id)?.[1];
    const getUser = (id: string) => ({ id, displayName: getDisplayName(id) });

    const getPrevBody = () => {
      const getUserArrayToString = users => users.map(getDisplayName).join(', ');

      const from = getDisplayName(mail.from);
      const date = moment(mail.date).format('DD/MM/YYYY HH:mm');
      const subject = mail.subject;

      const to = getUserArrayToString(mail.to);

      let header =
        '<br>' +
        '<br>' +
        '<p class="row ng-scope"></p>' +
        '<hr class="ng-scope">' +
        '<p class="ng-scope"></p>' +
        '<p class="medium-text ng-scope">' +
        '<span translate="" key="transfer.from"><span class="no-style ng-scope">De : </span></span>' +
        '<em class="ng-binding">' +
        from +
        '</em>' +
        '<br>' +
        '<span class="medium-importance" translate="" key="transfer.date"><span class="no-style ng-scope">Date: </span></span>' +
        '<em class="ng-binding">' +
        date +
        '</em>' +
        '<br>' +
        '<span class="medium-importance" translate="" key="transfer.subject"><span class="no-style ng-scope">Objet : </span></span>' +
        '<em class="ng-binding">' +
        subject +
        '</em>' +
        '<br>' +
        '<span class="medium-importance" translate="" key="transfer.to"><span class="no-style ng-scope">A : </span></span>' +
        '<em class="medium-importance">' +
        to +
        '</em>';

      if (mail.cc?.length > 0) {
        const cc = getUserArrayToString(mail.cc);

        header += `<br><span class="medium-importance" translate="" key="transfer.cc">
        <span class="no-style ng-scope">Copie à : </span>
        </span><em class="medium-importance ng-scope">${cc}</em>`;
      }

      header +=
        '</p><blockquote class="ng-scope">' +
        '<p class="ng-scope" style="font-size: 24px; line-height: 24px;">' +
        mail.body +
        '</p>';

      return header;
    };

    switch (draftType) {
      case DraftType.REPLY: {
        return {
          replyTo: mail.id,
          prevBody: getPrevBody(),
          mail: {
            to: route.params.currentFolder === 'sendMessages' ? mail.to.map(getUser) : [mail.from].map(getUser),
            subject: I18n.get('conversation-newmail-replysubject') + mail.subject,
          },
        };
      }
      case DraftType.REPLY_ALL: {
        const to = [] as {
          id: any;
          displayName: any;
        }[];
        if (route.params.currentFolder === 'sendMessages') {
          to.push(...mail.to.map(getUser));
        } else {
          to.push(getUser(mail.from));
          let i = 0;
          for (const user of mail.to) {
            if (user !== session?.user?.id && mail.to.indexOf(user) === i) {
              to.push(getUser(user));
            }
            ++i;
          }
        }
        const cc = [] as {
          id: any;
          displayName: any;
        }[];
        for (const id of mail.cc) {
          if (id !== mail.from) cc.push(getUser(id));
        }
        const cci = [] as {
          id: any;
          displayName: any;
        }[];
        for (const id of mail.cci) {
          if (id !== mail.from) cci.push(getUser(id));
        }
        return {
          replyTo: mail.id,
          prevBody: getPrevBody(),
          mail: {
            to,
            cc,
            cci,
            subject: I18n.get('conversation-newmail-replysubject') + mail.subject,
          },
        };
      }
      case DraftType.FORWARD: {
        return {
          replyTo: mail.id,
          prevBody: getPrevBody(),
          mail: {
            subject: I18n.get('conversation-newmail-forwardsubject') + mail.subject,
            body: '',
            attachments: mail.attachments,
          },
        };
      }
      case DraftType.DRAFT: {
        let prevbody = '';
        if (mail.body?.length > 0) {
          prevbody += '<hr class="ng-scope">' + mail.body.split('<hr class="ng-scope">').slice(1).join('<hr class="ng-scope">');
        }
        const currentBody = mail.body.split('<hr class="ng-scope">')[0];

        return {
          prevBody: prevbody,
          mail: {
            to: mail.to.map(getUser),
            cc: mail.cc.map(getUser),
            cci: mail.cci.map(getUser),
            subject: mail.subject,
            body: currentBody,
            attachments: mail.attachments,
          },
        };
      }
    }
  };

  getMailData = () => {
    let { mail, prevBody } = this.state;
    // Note: attachments can't be included in the body of the "send" and "draft" calls;
    // they are sent in a separate call.
    const { attachments, ...mailWithoutAttachments } = mail;
    const regexp = /(\r\n|\n|\r)/gm;

    const addWrapperIfNeeded = (text: string) => {
      if (!/<div class="ng-scope mobile-application-wrapper">/.test(text)) {
        return `<div class="ng-scope mobile-application-wrapper"><div>${text}</div></div>`;
      } else return `<div>${text}</div>`;
    };

    mailWithoutAttachments.body = addWrapperIfNeeded(mailWithoutAttachments.body.replace(regexp, '<br>'));
    if (prevBody === undefined) {
      prevBody = '';
    }

    const ret = {};
    for (const key in mailWithoutAttachments) {
      if (key === 'to' || key === 'cc' || key === 'cci') {
        ret[key] = mailWithoutAttachments[key].map(user => user.id);
      } else if (key === 'body') {
        ret[key] = mailWithoutAttachments[key] + prevBody;
      } else {
        ret[key] = mailWithoutAttachments[key];
      }
    }
    return ret;
  };

  getAttachmentData = async (file: LocalFile) => {
    const { addAttachment } = this.props;
    this.setState({ tempAttachment: file });
    try {
      const mailId = await this.saveDraft();
      const newAttachment = await addAttachment(mailId, file);
      await this.saveDraft();
      this.setState(prevState => ({
        mail: { ...prevState.mail, attachments: [...prevState.mail.attachments, newAttachment] },
        tempAttachment: null,
      }));
    } catch (e: any) {
      Keyboard.dismiss();
      // Full storage management
      // statusCode = 400 on iOS and code = 'ENOENT' on Android
      if (e?.response?.statusCode === 400 || e?.code === 'ENOENT') {
        Toast.showError(I18n.get('conversation-newmail-fullstorage'));
      } else {
        Toast.showError(I18n.get('conversation-newmail-attachmenterror'));
      }
      this.setState({ tempAttachment: null });
      throw e;
    }
  };

  forwardDraft = async () => {
    const { forwardMail } = this.props;
    const { id, replyTo } = this.state;
    try {
      forwardMail(id, replyTo);
    } catch {
      // TODO: Manage error
    }
  };

  saveDraft = async () => {
    const { mail, makeDraft, route, updateDraft } = this.props;
    const { id } = this.state;
    const draftType = route.params.type;
    const isSavedDraft = draftType === DraftType.DRAFT;
    const mailId = route.params.mailId;

    if (!id || (!isSavedDraft && id === mailId)) {
      const inReplyTo = mail.id;
      const isForward = route.params.type === DraftType.FORWARD;
      const idDraft = await makeDraft(this.getMailData(), inReplyTo, isForward);

      this.setState({ id: idDraft });
      if (isForward) this.forwardDraft();
      return idDraft;
    } else {
      updateDraft(id, this.getMailData());
      return id;
    }
  };

  sendDraft = async () => {
    try {
      const { navigation, sendMail } = this.props;
      const { id, replyTo } = this.state;

      this.setState({ isSending: true });
      Keyboard.dismiss();
      await sendMail(this.getMailData(), id, replyTo);
      navigation.dispatch(CommonActions.goBack());
      Toast.showSuccess(I18n.get('conversation-newmail-sendmail'));
    } catch {
      Toast.showError(I18n.get('conversation-newmail-senderror'));
      // TODO: Manage error
    } finally {
      this.setState({ isSending: false });
    }
  };

  public render() {
    const { deleteAttachment, isFetching, route } = this.props;
    const { id, isPrefilling, isSending, mail, tempAttachment, prevBody } = this.state;
    const draftType = route.params.type;
    const isReplyDraft = draftType === DraftType.REPLY || draftType === DraftType.REPLY_ALL; // true: body.
    const { attachments, body, ...headers } = mail;
    return (
      <>
        <HandleBack isSending={isSending} onBack={this.navigationHeaderFunction.getGoBack} />
        <PageView style={{ backgroundColor: theme.ui.background.card }}>
          <NewMailComponent
            isFetching={isFetching || !!isPrefilling}
            headers={headers}
            onDraftSave={this.saveDraft}
            onHeaderChange={changedHeaders => this.setState(prevState => ({ mail: { ...prevState.mail, ...changedHeaders } }))}
            body={mail.body.replace(/<br>/gs, '\n')}
            onBodyChange={changedBody => this.setState(prevState => ({ mail: { ...prevState.mail, body: changedBody } }))}
            attachments={tempAttachment ? [...mail.attachments, tempAttachment] : mail.attachments}
            onAttachmentChange={changedAttachments =>
              this.setState(prevState => ({ mail: { ...prevState.mail, attachments: changedAttachments } }))
            }
            onAttachmentDelete={attachmentId => deleteAttachment(id, attachmentId)}
            prevBody={prevBody}
            isReplyDraft={isReplyDraft}
          />
        </PageView>
      </>
    );
  }
}

const mapStateToProps = (state: IGlobalState) => {
  const { isFetching, data } = getMailContentState(state);
  return {
    mail: data,
    isFetching,
    session: getSession(),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      setup: fetchVisiblesAction,
      sendMail: sendMailAction,
      forwardMail: forwardMailAction,
      makeDraft: makeDraftMailAction,
      updateDraft: updateDraftMailAction,
      trashMessage: trashMailsAction,
      deleteMessage: deleteMailsAction,
      addAttachment: addAttachmentAction,
      deleteAttachment: deleteAttachmentAction,
      clearContent: clearMailContentAction,
      fetchMailContent: fetchMailContentAction,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(NewMailScreen);
