import { decode } from 'html-entities';
import moment from 'moment';

import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { IFolder, IMail, IQuota, IRecipient, ISignature } from '~/framework/modules/zimbra/model';
import { IDistantFileWithId, LocalFile } from '~/framework/util/fileHandler';
import fileHandlerService from '~/framework/util/fileHandler/service';
import { extractTextFromHtml } from '~/framework/util/htmlParser/content';
import { fetchJSONWithCache } from '~/infra/fetchWithCache';

const BLANK_SUBJECT = '(Aucun objet)';

type IBackendAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
};

type IBackendFolder = {
  id: string;
  folderName: string;
  path: string;
  unread: number;
  count: number;
  folders: IBackendFolder[];
};

type IBackendMail = {
  id: string;
  date: number;
  subject: string;
  parent_id: string;
  thread_id: string;
  state: string;
  unread: boolean;
  response: boolean;
  hasAttachment: boolean;
  systemFolder: string;
  to: string[];
  cc: string[];
  bcc: string[];
  displayNames: string[][];
  attachments: IBackendAttachment[];
  body: string;
  from: string;
};

type IBackendQuota = {
  storage: number;
  quota: string;
};

type IBackendRecipient = {
  id: string;
  displayName?: string;
  name?: string;
  groupDisplayName: string | null;
  profile: string | null;
  structureName: string | null;
};

type IBackendRecipientDirectory = {
  groups: IBackendRecipient[];
  users: IBackendRecipient[];
};

type IBackendSignature = {
  preference: string;
  zimbraENTSignatureExists: boolean;
  id: string;
};

type IBackendUser = {
  id: string;
  displayName: string;
  type: string[];
};

type IBackendFolderList = IBackendFolder[];
type IBackendMailList = Omit<IBackendMail, 'body'>[];
type IBackendUserList = IBackendUser[];

const attachmentAdapter = (data: IBackendAttachment, platformUrl: string, mailId: string): IDistantFileWithId => {
  return {
    id: data.id,
    url: `${platformUrl}/zimbra/message/${mailId}/attachment/${data.id}`,
    filename: data.filename,
    filetype: data.contentType,
    filesize: data.size,
  };
};

const folderAdapter = (data: IBackendFolder): IFolder => {
  return {
    id: data.id,
    name: data.folderName,
    path: data.path,
    unread: data.unread,
    count: data.count,
    folders: data.folders.map(folderAdapter),
  };
};

const mailAdapter = (data: IBackendMail, platformUrl: string): IMail => {
  return {
    id: data.id,
    date: moment(data.date),
    subject: data.subject,
    parentId: data.parent_id,
    threadId: data.thread_id,
    state: data.state,
    unread: data.unread,
    response: data.response,
    hasAttachment: data.hasAttachment,
    systemFolder: data.systemFolder,
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    displayNames: data.displayNames,
    attachments: data.attachments.map(attachment => attachmentAdapter(attachment, platformUrl, data.id)),
    body: data.body,
    from: data.from,
    key: data.id,
  };
};

const mailFromListAdapter = (data: Omit<IBackendMail, 'body'>, platformUrl: string): Omit<IMail, 'body'> => {
  return {
    id: data.id,
    date: moment(data.date),
    subject: data.subject,
    parentId: data.parent_id,
    threadId: data.thread_id,
    state: data.state,
    unread: data.unread,
    response: data.response,
    hasAttachment: data.hasAttachment,
    systemFolder: data.systemFolder,
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    displayNames: data.displayNames,
    attachments: data.attachments.map(attachment => attachmentAdapter(attachment, platformUrl, data.id)),
    from: data.from,
    key: data.id,
  };
};

const quotaAdapter = (data: IBackendQuota): IQuota => {
  return {
    storage: data.storage,
    quota: Number(data.quota),
  };
};

const recipientAdapter = (data: IBackendRecipient): IRecipient => {
  return {
    id: data.id,
    displayName: data.displayName ?? data.name!,
    groupDisplayName: data.groupDisplayName ?? undefined,
    profile: data.profile ?? undefined,
    structureName: data.structureName ?? undefined,
  };
};

const recipientDirectoryAdapter = (data: IBackendRecipientDirectory, query: string): IRecipient[] => {
  const groups = data.groups.map(recipientAdapter).filter(group => group.displayName.toLowerCase().includes(query.toLowerCase()));
  const users = data.users.map(recipientAdapter);
  return groups.concat(users);
};

const signatureAdapter = (data: IBackendSignature): ISignature => {
  const preference = JSON.parse(data.preference);
  return {
    preference: {
      signature: extractTextFromHtml(decode(preference.signature)) as string,
      useSignature: preference.useSignature,
    },
    zimbraENTSignatureExists: data.zimbraENTSignatureExists,
    id: data.id,
  };
};

export const zimbraService = {
  draft: {
    addAttachment: async (session: AuthLoggedAccount, draftId: string, file: LocalFile) => {
      const api = `/zimbra/message/${draftId}/attachment`;
      let attachments: IBackendAttachment[] = [];
      await fileHandlerService.uploadFile(
        session,
        file,
        {
          url: api,
          headers: {
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          binaryStreamOnly: true,
        },
        data => {
          attachments = JSON.parse(data).attachments as IBackendAttachment[];
          return attachments as any;
        },
      );
      return attachments.map(attachment => attachmentAdapter(attachment, session.platform.url, draftId));
    },
    create: async (session: AuthLoggedAccount, mail: Partial<IMail>, inReplyTo?: string, isForward?: boolean) => {
      let api = '/zimbra/draft';
      if (inReplyTo) api += `?In-Reply-To=${inReplyTo}`;
      if (isForward) api += '&reply=F';
      const body = JSON.stringify(mail);
      const response = (await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      })) as { id: string };
      return response.id;
    },
    deleteAttachment: async (session: AuthLoggedAccount, draftId: string, attachmentId: string) => {
      const api = `/zimbra/message/${draftId}/attachment/${attachmentId}`;
      await fetchJSONWithCache(api, {
        method: 'DELETE',
      });
    },
    forward: async (session: AuthLoggedAccount, draftId: string, forwardFrom: string) => {
      const api = `/zimbra/message/${draftId}/forward/${forwardFrom}`;
      await fetchJSONWithCache(api, {
        method: 'PUT',
      });
    },
    update: async (session: AuthLoggedAccount, draftId: string, mail: Partial<IMail>) => {
      const api = `/zimbra/draft/${draftId}`;
      const body = JSON.stringify(mail);
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
  },
  folder: {
    create: async (session: AuthLoggedAccount, name: string, parentId?: string) => {
      const api = '/zimbra/folder';
      const body = JSON.stringify({
        name,
        parentId,
      });
      await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      });
    },
  },
  mails: {
    listFromFolder: async (session: AuthLoggedAccount, folder: string, page: number, search?: string) => {
      let api = `/zimbra/list?folder=${folder}&page=${page}&unread=false`;
      if (search) api += `&search=${search}`;
      const mails = (await fetchJSONWithCache(api)) as IBackendMailList;
      return mails.map(mail => mailFromListAdapter(mail, session.platform.url));
    },
    delete: async (session: AuthLoggedAccount, ids: string[]) => {
      const api = '/zimbra/delete';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'DELETE',
        body,
      });
    },
    moveToInbox: async (session: AuthLoggedAccount, ids: string[]) => {
      const api = '/zimbra/move/root';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    moveToFolder: async (session: AuthLoggedAccount, ids: string[], folderId: string) => {
      const api = `/zimbra/move/userfolder/${folderId}`;
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    restore: async (session: AuthLoggedAccount, ids: string[]) => {
      const api = '/zimbra/restore';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    toggleUnread: async (session: AuthLoggedAccount, ids: string[], unread: boolean) => {
      let api = '/zimbra/toggleUnread?';
      api += ids.reduce((s, id) => s + 'id=' + id + '&', '');
      api += `unread=${unread}`;
      await fetchJSONWithCache(api, {
        method: 'POST',
      });
    },
    trash: async (session: AuthLoggedAccount, ids: string[]) => {
      const api = '/zimbra/trash';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
  },
  mail: {
    get: async (session: AuthLoggedAccount, id: string, toggleRead: boolean = true) => {
      const api = `/zimbra/message/${id}?read=${toggleRead}`;
      const mail = (await fetchJSONWithCache(api)) as IBackendMail;
      if (!('id' in mail)) throw new Error();
      return mailAdapter(mail, session.platform.url);
    },
    send: async (session: AuthLoggedAccount, mail: Partial<IMail>, draftId?: string, inReplyTo?: string) => {
      let api = '/zimbra/send';
      if (draftId) api += `?id=${draftId}`;
      if (inReplyTo) api += `&In-Reply-To=${inReplyTo}`;
      if (!mail.subject) mail.subject = BLANK_SUBJECT;
      const body = JSON.stringify(mail);
      await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      });
    },
  },
  quota: {
    get: async (session: AuthLoggedAccount) => {
      const api = '/zimbra/quota';
      const quota = (await fetchJSONWithCache(api)) as IBackendQuota;
      return quotaAdapter(quota);
    },
  },
  recipients: {
    search: async (session: AuthLoggedAccount, query: string) => {
      const api = `/zimbra/visible?search=${query}`;
      const recipientDirectory = (await fetchJSONWithCache(api)) as IBackendRecipientDirectory;
      return recipientDirectoryAdapter(recipientDirectory, query);
    },
  },
  rootFolders: {
    get: async (session: AuthLoggedAccount) => {
      const api = '/zimbra/root-folder';
      const folders = (await fetchJSONWithCache(api)) as IBackendFolderList;
      return folders.map(folderAdapter);
    },
  },
  signature: {
    get: async (session: AuthLoggedAccount) => {
      const api = '/zimbra/signature';
      const signature = (await fetchJSONWithCache(api)) as IBackendSignature;
      return signatureAdapter(signature);
    },
    update: async (session: AuthLoggedAccount, signature: string, useSignature: boolean) => {
      const api = '/zimbra/signature';
      const body = JSON.stringify({
        signature,
        useSignature,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
  },
  user: {
    get: async (session: AuthLoggedAccount, id: string) => {
      const api = `/userbook/api/person?id=${id}&type=undefined`;
      const data = (await fetchJSONWithCache(api)) as { result: IBackendUserList };
      return data.result[0];
    },
  },
};
