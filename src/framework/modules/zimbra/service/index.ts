import moment from 'moment';

import { ISession } from '~/framework/modules/auth/model';
import { IFolder, IMail, IQuota, ISignature } from '~/framework/modules/zimbra/model';
import { LocalFile } from '~/framework/util/fileHandler';
import fileHandlerService from '~/framework/util/fileHandler/service';
import { fetchJSONWithCache } from '~/infra/fetchWithCache';

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

type IBackendSignature = {
  preference: {
    useSignature: boolean;
    signature: string;
  };
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

const folderAdapter = (data: IBackendFolder): IFolder => {
  return {
    id: data.id,
    name: data.folderName,
    path: data.path,
    unread: data.unread,
    count: data.count,
    folders: data.folders.map(f => folderAdapter(f)),
  } as IFolder;
};

const mailAdapter = (data: IBackendMail): IMail => {
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
    attachments: data.attachments,
    body: data.body,
    from: data.from,
  } as IMail;
};

/*const mailBackendAdapter = (data: IMail): IBackendMail => {
  return {
    id: data.id,
    date: data.date.unix(),
    subject: data.subject,
    parent_id: data.parentId,
    thread_id: data.threadId,
    state: data.state,
    unread: data.unread,
    response: data.response,
    hasAttachment: data.hasAttachment,
    systemFolder: data.systemFolder,
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    displayNames: data.displayNames,
    attachments: data.attachments,
    body: data.body,
    from: data.from,
  } as IBackendMail;
};*/

const mailFromListAdapter = (data: Omit<IBackendMail, 'body'>): IMail => {
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
    attachments: data.attachments,
    from: data.from,
  } as IMail;
};

const quotaAdapter = (data: IBackendQuota): IQuota => {
  return {
    storage: data.storage,
    quota: Number(data.quota),
  } as IQuota;
};

const signatureAdapter = (data: IBackendSignature): ISignature => {
  return {
    preference: data.preference,
    zimbraENTSignatureExists: data.zimbraENTSignatureExists,
    id: data.id,
  } as ISignature;
};

export const zimbraService = {
  draft: {
    addAttachment: async (session: ISession, draftId: string, file: LocalFile) => {
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
      return attachments;
    },
    create: async (session: ISession, mail: IMail, inReplyTo?: string, isForward?: boolean) => {
      let api = '/zimbra/draft';
      if (inReplyTo) api += `?In-Reply-To=${inReplyTo}`;
      if (isForward) api += '&reply=F';
      const body = JSON.stringify(mail);
      const response = await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      });
      return response.id;
    },
    deleteAttachment: async (session: ISession, draftId: string, attachmentId: string) => {
      const api = `/zimbra/message/${draftId}/attachment/${attachmentId}`;
      await fetchJSONWithCache(api, {
        method: 'DELETE',
      });
    },
    forward: async (session: ISession, draftId: string, forwardFrom: string) => {
      const api = `/zimbra/message/${draftId}/forward/${forwardFrom}`;
      await fetchJSONWithCache(api, {
        method: 'PUT',
      });
    },
    update: async (session: ISession, draftId: string, mail: IMail) => {
      const api = `/zimbra/draft/${draftId}`;
      const body = JSON.stringify(mail);
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
  },
  folder: {
    create: async (session: ISession, name: string, parentId?: string) => {
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
    listFromFolder: async (session: ISession, folder: string, page: number, search?: string) => {
      let api = `/zimbra/list?folder=${folder}&page=${page}&unread=false`;
      if (search) api += `&search=${search}`;
      const mails = (await fetchJSONWithCache(api)) as IBackendMailList;
      return mails.map(mail => mailFromListAdapter(mail)) as Omit<IMail, 'body'>[];
    },
    delete: async (session: ISession, ids: string[]) => {
      const api = '/zimbra/delete';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'DELETE',
        body,
      });
    },
    moveToInbox: async (session: ISession, ids: string[]) => {
      const api = '/zimbra/move/root';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    moveToFolder: async (session: ISession, ids: string[], folderId: string) => {
      const api = `/zimbra/move/userfolder/${folderId}`;
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    restore: async (session: ISession, ids: string[]) => {
      const api = '/zimbra/restore';
      const body = JSON.stringify({
        id: ids,
      });
      await fetchJSONWithCache(api, {
        method: 'PUT',
        body,
      });
    },
    toggleUnread: async (session: ISession, ids: string[], unread: boolean) => {
      let api = '/zimbra/toggleUnread?';
      api += ids.reduce((s, id) => s + 'id=' + id + '&', '');
      api += `&unread=${unread}`;
      await fetchJSONWithCache(api, {
        method: 'POST',
      });
    },
    trash: async (session: ISession, ids: string[]) => {
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
    get: async (session: ISession, id: string) => {
      const api = `/zimbra/message/${id}`;
      const mail = (await fetchJSONWithCache(api)) as IBackendMail;
      return mailAdapter(mail) as IMail;
    },
    send: async (session: ISession, mail: IMail, draftId?: string, inReplyTo?: string) => {
      let api = '/zimbra/send';
      if (draftId) api += `?id=${draftId}`;
      if (inReplyTo) api += `&In-Reply-To=${inReplyTo}`;
      const body = JSON.stringify(mail);
      await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      });
    },
  },
  quota: {
    get: async (session: ISession) => {
      const api = '/zimbra/quota';
      const quota = (await fetchJSONWithCache(api)) as IBackendQuota;
      return quotaAdapter(quota) as IQuota;
    },
  },
  recipients: {
    search: async (session: ISession, query: string) => {
      const api = `/zimbra/visible?search=${query}`;
      const recipients = (await fetchJSONWithCache(api)) as {
        groups: {
          id: string;
          name: string;
          displayName: string | null;
          structureName: string | null;
        }[];
        users: {
          id: string;
          displayName: string;
          profile: string;
        }[];
      };
      return recipients;
    },
  },
  rootFolders: {
    get: async (session: ISession) => {
      const api = '/zimbra/root-folder';
      const folders = (await fetchJSONWithCache(api)) as IBackendFolderList;
      return folders.map(folder => folderAdapter(folder)) as IFolder[];
    },
  },
  signature: {
    get: async (session: ISession) => {
      const api = '/zimbra/signature';
      const signature = (await fetchJSONWithCache(api)) as IBackendSignature;
      return signatureAdapter(signature) as ISignature;
    },
    update: async (session: ISession, signature: string, useSignature: boolean) => {
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
    get: async (session: ISession, id: string) => {
      const api = `/userbook/api/person?id=${id}&type=undefined`;
      const data = (await fetchJSONWithCache(api)) as { result: IBackendUserList };
      return data.result[0];
    },
  },
};