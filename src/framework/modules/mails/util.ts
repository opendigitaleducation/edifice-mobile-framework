import moment from 'moment';

import {
  IMailsFolder,
  IMailsMailAttachment,
  MailsDefaultFolders,
  MailsRecipientGroupInfo,
  MailsRecipientInfo,
  MailsRecipients,
  MailsRecipientsType,
  MailsVisible,
  MailsVisibleType,
} from './model';

import { I18n } from '~/app/i18n';
import { IDistantFileWithId } from '~/framework/util/fileHandler';
import { urlSigner } from '~/infra/oauth';

export const MailsRecipientPrefixsI18n = {
  [MailsRecipientsType.TO]: {
    name: 'mails-prefixto',
    placeholder: 'mails-prefixto-placeholder',
  },
  [MailsRecipientsType.CC]: {
    name: 'mails-prefixcc',
    placeholder: 'mails-prefixcc-placeholder',
  },
  [MailsRecipientsType.CCI]: {
    name: 'mails-prefixcci',
    placeholder: 'mails-prefixcci-placeholder',
  },
};

export function mailsFormatRecipients(
  to: MailsRecipients,
  cc: MailsRecipients,
  cci: MailsRecipients,
): { text: string; ids: string[] } {
  const formatPart = (prefixKey: string, recipients: MailsRecipients): string | null => {
    const { groups, users } = recipients;
    const formatDisplayName = (prefix, primary, count) => `${I18n.get(prefix)} ${primary}${count > 0 ? ` +${count}` : ''}`;

    if (users.length > 0) {
      const nbOtherUsers = users.length - 1 + groups.length;
      return formatDisplayName(prefixKey, users[0].displayName, nbOtherUsers);
    }
    if (groups.length > 0) {
      const nbOtherGroups = groups.length - 1;
      return formatDisplayName(prefixKey, groups[0].displayName, nbOtherGroups);
    }
    return null;
  };

  const extractIds = (recipients: MailsRecipients): string[] => [
    ...recipients.users.map(user => user.id),
    ...recipients.groups.map(group => group.id),
  ];

  const parts = [formatPart('mails-prefixto', to), formatPart('mails-prefixcc', cc), formatPart('mails-prefixcci', cci)].filter(
    Boolean,
  );

  const ids = [...extractIds(to), ...extractIds(cc), ...extractIds(cci)];

  return {
    ids,
    text: parts.length > 0 ? parts.join(' ') : I18n.get('mails-list-norecipient'),
  };
}

export function convertAttachmentToDistantFile(attachment: IMailsMailAttachment, mailId: string): IDistantFileWithId {
  return {
    filename: attachment.filename,
    filesize: attachment.size,
    filetype: attachment.contentType,
    id: attachment.id,
    url: urlSigner.getAbsoluteUrl(`/conversation/message/${mailId}/attachment/${attachment.id}`) ?? '',
  };
}

export function convertRecipientUserInfoToVisible(userInfo: MailsRecipientInfo): MailsVisible {
  return {
    displayName: userInfo.displayName,
    groupDisplayName: '',
    id: userInfo.id,
    profile: userInfo.profile,
    structureName: '',
    type: MailsVisibleType.USER,
  };
}

export function convertRecipientGroupInfoToVisible(groupInfo: MailsRecipientGroupInfo): MailsVisible {
  return {
    displayName: groupInfo.displayName,
    groupDisplayName: '',
    id: groupInfo.id,
    profile: undefined,
    structureName: '',
    type: MailsVisibleType.GROUP,
  };
}

export const flattenFolders = (folders: IMailsFolder[]) => {
  const result: IMailsFolder[] = [];

  folders.forEach(folder => {
    result.push(folder);
    if (folder.subFolders) {
      result.push(...flattenFolders(folder.subFolders));
    }
  });

  return result;
};

export const mailsDefaultFoldersInfos = {
  [MailsDefaultFolders.INBOX]: {
    icon: 'ui-depositeInbox',
    title: 'mails-list-inbox',
  },
  [MailsDefaultFolders.OUTBOX]: {
    icon: 'ui-send',
    title: 'mails-list-outbox',
  },
  [MailsDefaultFolders.DRAFTS]: {
    icon: 'ui-edit',
    title: 'mails-list-drafts',
  },
  [MailsDefaultFolders.TRASH]: {
    icon: 'ui-delete',
    title: 'mails-list-trash',
  },
};

export function separateContentAndHistory(html: string) {
  const historyStartIndex = html.indexOf('<hr class="ng-scope"><p class="ng-scope"></p><p class="medium-text');
  if (historyStartIndex !== -1) {
    const content = html.slice(0, historyStartIndex).trim();
    const history = html.slice(historyStartIndex).trim();
    return { content, history };
  }
  return { content: html.trim(), history: '' };
}

export function addHtmlForward(from: MailsRecipientInfo, to: MailsVisible[], subject: string, body: string): string {
  return `<br><br><div>-----Message transféré-----</div><div>De: ${from?.displayName}</div><div>Date: ${moment().format('DD/MM/YYYY hh:mm')}</div><div>Objet: ${subject}</div><div>À: ${to.map(recipient => recipient.displayName).join(', ')}</div><br>${body}`;
}
