import * as React from 'react';
import { Alert, Keyboard, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from './styles';
import { MailsEditType, type MailsEditScreenPrivateProps } from './types';

import { UNSTABLE_usePreventRemove } from '@react-navigation/native';
import { connect } from 'react-redux';
import { I18n } from '~/app/i18n';
import Attachments from '~/framework/components/attachments';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { RichEditorForm } from '~/framework/components/inputs/rich-text';
import PopupMenu from '~/framework/components/menus/popup';
import { NavBarAction, NavBarActionsGroup } from '~/framework/components/navigation';
import toast from '~/framework/components/toast';
import { ContentLoader } from '~/framework/hooks/loader';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { MailsContactField, MailsObjectField } from '~/framework/modules/mails/components/fields';
import MailsPlaceholderEdit from '~/framework/modules/mails/components/placeholder/edit';
import { MailsDefaultFolders, MailsRecipientsType, MailsVisible } from '~/framework/modules/mails/model';
import { MailsNavigationParams, mailsRouteNames } from '~/framework/modules/mails/navigation';
import { mailsService } from '~/framework/modules/mails/service';
import {
  addHtmlForward,
  convertAttachmentToDistantFile,
  convertRecipientGroupInfoToVisible,
  convertRecipientUserInfoToVisible,
} from '~/framework/modules/mails/util';
import { navBarOptions } from '~/framework/navigation/navBar';
import { IDistantFileWithId } from '~/framework/util/fileHandler';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<MailsNavigationParams, typeof mailsRouteNames.edit>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: '',
  }),
});

const MailsEditScreen = (props: MailsEditScreenPrivateProps) => {
  const { initialMailInfo, draftId, type, fromFolder } = props.route.params;
  const textInitialContentHTML = React.useMemo((): string => {
    if (type === MailsEditType.FORWARD)
      return addHtmlForward(
        initialMailInfo?.from ?? { id: '', displayName: '', profile: AccountType.Guest },
        initialMailInfo?.to ?? [],
        initialMailInfo?.subject ?? '',
        initialMailInfo?.body ?? '',
      );
    return initialMailInfo?.body ?? '';
  }, []);

  const [visibles, setVisibles] = React.useState<MailsVisible[]>();
  const [allInputsSelectedRecipients, setAllInputsSelectedRecipients] = React.useState<string[]>([]);
  const [initialContentHTML, setInitialContentHTML] = React.useState(textInitialContentHTML);
  const [body, setBody] = React.useState(textInitialContentHTML);
  const [subject, setSubject] = React.useState(initialMailInfo?.subject ?? '');
  const [to, setTo] = React.useState<MailsVisible[]>(type === MailsEditType.FORWARD ? [] : (initialMailInfo?.to ?? []));
  const [cc, setCc] = React.useState<MailsVisible[]>(initialMailInfo?.cc ?? []);
  const [cci, setCci] = React.useState<MailsVisible[]>(initialMailInfo?.cci ?? []);
  const [attachments, setAttachments] = React.useState<IDistantFileWithId[]>([]);
  const [moreRecipientsFields, setMoreRecipientsFields] = React.useState<boolean>(false);
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [draftIdSaved, setDraftIdSaved] = React.useState<string | undefined>(draftId ?? undefined);
  const [inputFocused, setInputFocused] = React.useState<MailsRecipientsType | null>(null);
  const [isStartScroll, setIsStartScroll] = React.useState<boolean>(false);

  const richEditorRef = React.useRef(null);

  const haveInitialCcCci =
    (initialMailInfo?.cc && initialMailInfo?.cc.length > 0) || (initialMailInfo?.cci && initialMailInfo?.cci.length > 0);

  const openMoreRecipientsFields = () => setMoreRecipientsFields(true);

  const onAddAttachment = async attachment => {
    try {
      let mailId = '';
      if (draftIdSaved) {
        mailId = draftIdSaved;
      } else {
        const toIds = to.map(recipient => recipient.id);
        const ccIds = cc.map(recipient => recipient.id);
        const cciIds = cci.map(recipient => recipient.id);

        mailId = await mailsService.mail.sendToDraft({ body, subject, to: toIds, cc: ccIds, cci: cciIds });
        setDraftIdSaved(mailId);
      }
      const fileUploaded = await mailsService.attachments.add({ mailId }, attachment, props.session!);
      return fileUploaded;
    } catch (e) {
      console.error(e);
    }
  };

  const onRemoveAttachment = async attachment => {
    try {
      await mailsService.attachments.remove({ mailId: draftIdSaved!, attachmentId: attachment.id });
      setAttachments(attachments.filter(att => att.id !== attachment.id));
    } catch (e) {
      console.error(e);
      toast.showError();
    }
  };

  const onChangeRecipient = (selectedRecipients, type, userId) => {
    const stateSetters: Record<MailsRecipientsType, React.Dispatch<React.SetStateAction<MailsVisible[]>>> = {
      to: setTo,
      cc: setCc,
      cci: setCci,
    };

    stateSetters[type](selectedRecipients);

    if (allInputsSelectedRecipients?.includes(userId))
      setAllInputsSelectedRecipients(prev => prev.filter(recipientId => recipientId !== userId));
    else setAllInputsSelectedRecipients(prev => [...prev, userId]);
  };

  const onDeleteDraft = async () => {
    Alert.alert(I18n.get('mails-edit-deletedrafttitle'), I18n.get('mails-edit-deletedrafttext'), [
      {
        onPress: () => {},
        style: 'default',
        text: I18n.get('common-cancel'),
      },
      {
        onPress: async () => {
          try {
            setIsSending(true);
            if (!draftIdSaved)
              return props.navigation.navigate(mailsRouteNames.home, {
                from: fromFolder ?? MailsDefaultFolders.INBOX,
              });

            await mailsService.mail.moveToTrash({ ids: [draftIdSaved] });
            props.navigation.navigate(mailsRouteNames.home, {
              from: fromFolder ?? MailsDefaultFolders.INBOX,
              reload: fromFolder === MailsDefaultFolders.DRAFTS,
            });
            toast.showSuccess(I18n.get('mails-edit-toastsuccessdeletedraft'));
            setIsSending(false);
          } catch (e) {
            console.error(e);
            toast.showError();
            setIsSending(false);
          }
        },
        style: 'destructive',
        text: I18n.get('common-delete'),
      },
    ]);
  };

  const onSendDraft = async () => {
    try {
      setIsSending(true);
      const toIds = to.map(recipient => recipient.id);
      const ccIds = cc.map(recipient => recipient.id);
      const cciIds = cci.map(recipient => recipient.id);

      if (draftIdSaved) {
        await mailsService.mail.updateDraft({ draftId: draftIdSaved }, { body, subject, to: toIds, cc: ccIds, cci: cciIds });
      } else {
        await mailsService.mail.sendToDraft({ body, subject, to: toIds, cc: ccIds, cci: cciIds });
      }
      props.navigation.navigate(mailsRouteNames.home, {
        from: fromFolder ?? MailsDefaultFolders.INBOX,
        reload: fromFolder === MailsDefaultFolders.DRAFTS,
      });
      toast.showSuccess(I18n.get('mails-edit-toastsuccesssavedraft'));
      setIsSending(false);
    } catch (e) {
      console.error(e);
      toast.showError();
      setIsSending(false);
    }
  };

  const onSend = async () => {
    try {
      setIsSending(true);
      const toIds = to.map(recipient => recipient.id);
      const ccIds = cc.map(recipient => recipient.id);
      const cciIds = cci.map(recipient => recipient.id);

      await mailsService.mail.send(
        { inReplyTo: initialMailInfo?.id ?? undefined, draftId: draftIdSaved },
        { body, subject, to: toIds, cc: ccIds, cci: cciIds },
      );
      props.navigation.navigate(mailsRouteNames.home, {
        from: fromFolder ?? MailsDefaultFolders.INBOX,
        reload: fromFolder === MailsDefaultFolders.OUTBOX || fromFolder === MailsDefaultFolders.DRAFTS,
      });
      toast.showSuccess(I18n.get('mails-edit-toastsuccesssend'));
      setIsSending(false);
    } catch (e) {
      console.error(e);
      toast.showError();
      setIsSending(false);
    }
  };

  const onCheckSend = () => {
    if (!body || !subject) {
      Keyboard.dismiss();
      Alert.alert(
        I18n.get('mails-edit-missingcontenttitle'),
        I18n.get(!body ? 'mails-edit-missingbodytext' : 'mails-edit-missingsubjecttext'),
        [
          {
            onPress: onSend,
            text: I18n.get('common-send'),
          },
          {
            style: 'cancel',
            text: I18n.get('common-cancel'),
          },
        ],
      );
    } else {
      onSend();
    }
  };

  const loadData = async () => {
    try {
      const dataVisibles = await mailsService.visibles.getAll();
      setVisibles(dataVisibles);

      if (draftIdSaved) {
        const draft = await mailsService.mail.get({ id: draftId! });

        const convertDraftRecipients = (recipients: { users: any[]; groups: any[] }): MailsVisible[] => {
          const { users, groups } = recipients;
          return [...users.map(convertRecipientUserInfoToVisible), ...groups.map(convertRecipientGroupInfoToVisible)];
        };

        const toDraft = convertDraftRecipients(draft.to);
        const ccDraft = convertDraftRecipients(draft.cc);
        const cciDraft = convertDraftRecipients(draft.cci);
        const convertedAttachments = draft.attachments.map(attachment => convertAttachmentToDistantFile(attachment, draftIdSaved));

        setInitialContentHTML(draft.body);
        setSubject(draft.subject);
        setTo(toDraft);
        setCc(ccDraft);
        setCci(cciDraft);
        setAttachments(convertedAttachments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showPreventBack = React.useMemo(
    () =>
      isSending !== true &&
      !(
        to.length === 0 &&
        cc.length === 0 &&
        cci.length === 0 &&
        body?.trim() === '' &&
        subject?.trim() === '' &&
        attachments.length === 0
      ),
    [attachments, body, cc, cci, isSending, subject, to],
  );

  UNSTABLE_usePreventRemove(showPreventBack, () => onSendDraft());

  const popupActionsMenu = [
    {
      action: onSendDraft,
      icon: {
        android: 'ic_pencil',
        ios: 'pencil.and.list.clipboard',
      },
      title: I18n.get('mails-edit-savedraft'),
    },
    {
      action: onDeleteDraft,
      destructive: true,
      icon: {
        android: 'ic_delete_item',
        ios: 'trash',
      },
      title: I18n.get('mails-edit-deletedraft'),
    },
  ];

  React.useEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <NavBarActionsGroup
          elements={[
            <NavBarAction icon="ui-send" disabled={to.length === 0 && cc.length === 0 && cci.length === 0} onPress={onCheckSend} />,
            <PopupMenu actions={draftIdSaved ? popupActionsMenu : popupActionsMenu.slice(0, -1)}>
              <NavBarAction icon="ui-options" />
            </PopupMenu>,
          ]}
        />
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, cc, cci, subject, draftIdSaved, body, onCheckSend]);

  const renderTopForm = React.useCallback(() => {
    if (!visibles) return;

    const commonProps = {
      visibles,
      onChangeRecipient,
      allInputsSelectedRecipients,
      richEditorRef,
      inputFocused,
      onFocus: setInputFocused,
      isStartScroll,
    };

    return (
      <View>
        <MailsContactField
          type={MailsRecipientsType.TO}
          recipients={to}
          onOpenMoreRecipientsFields={openMoreRecipientsFields}
          hideCcCciButton={haveInitialCcCci}
          {...commonProps}
        />
        {moreRecipientsFields || haveInitialCcCci ? (
          <>
            <MailsContactField type={MailsRecipientsType.CC} recipients={cc} {...commonProps} />
            <MailsContactField type={MailsRecipientsType.CCI} recipients={cci} {...commonProps} />
          </>
        ) : null}
        <MailsObjectField subject={subject} type={type} onChangeText={text => setSubject(text)} />
      </View>
    );
  }, [
    visibles,
    to,
    cc,
    cci,
    subject,
    initialMailInfo,
    type,
    isStartScroll,
    richEditorRef,
    inputFocused,
    allInputsSelectedRecipients,
    onChangeRecipient,
    openMoreRecipientsFields,
  ]);

  const renderBottomForm = React.useCallback(
    () => (
      <View style={styles.bottomForm}>
        <Attachments
          isEditing
          attachments={attachments}
          addAttachmentAction={onAddAttachment}
          removeAttachmentAction={onRemoveAttachment}
        />
        <View style={{ minHeight: 600 }} />
      </View>
    ),
    [attachments, onAddAttachment, onRemoveAttachment],
  );

  const renderContent = React.useCallback(() => {
    return (
      <RichEditorForm
        ref={richEditorRef}
        topForm={renderTopForm()}
        initialContentHtml={initialContentHTML}
        editorStyle={styles.editor}
        bottomForm={renderBottomForm()}
        onChangeText={value => setBody(value)}
        saving={true}
        uploadParams={{
          parent: 'protected',
        }}
        placeholder={I18n.get('mails-edit-contentplaceholder')}
        onScrollBeginDrag={() => {
          setIsStartScroll(true);
          setTimeout(() => setIsStartScroll(false), 1000);
        }}
      />
    );
  }, [initialContentHTML, renderBottomForm, renderTopForm, setBody]);

  return (
    <ContentLoader
      loadContent={loadData}
      renderContent={renderContent}
      renderError={() => <EmptyConnectionScreen />}
      renderLoading={() => <MailsPlaceholderEdit />}
    />
  );
};

export default connect(() => ({
  session: getSession(),
}))(MailsEditScreen);
