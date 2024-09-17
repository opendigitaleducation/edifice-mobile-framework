/**
 * API Consumer for Backend Workspace application
 */
import moment from 'moment';
import queryString from 'query-string';

import { I18n } from '~/app/i18n';
import { UI_SIZES } from '~/framework/components/constants';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { assertSession } from '~/framework/modules/auth/reducer';
import { Filter, IFile } from '~/framework/modules/workspace/reducer';
import { workspaceFolderListAdapter } from '~/framework/modules/workspace/service/folderAdaptater';
import { IMAGE_MAX_DIMENSION, LocalFile, SyncedFileWithId } from '~/framework/util/fileHandler';
import fileTransferService, { IUploadCallbaks, IUploadCommonParams } from '~/framework/util/fileHandler/service';
import { fetchJSONWithCache, signedFetchJson } from '~/infra/fetchWithCache';

const implicitWorkspaceUploadParams = {
  owner: {}, // Exists BackEnd side but not useed yet!
  protected: { protected: 'true', application: 'media-library' },
  root: {}, // Exists BackEnd side but not useed yet! // Exists BackEnd side but not useed yet!
  shared: {}, // Exists BackEnd side but not useed yet!
  trash: {}, // Exists BackEnd side but not useed yet!
};

export type WorkspaceParentItem = keyof typeof implicitWorkspaceUploadParams | string;
export interface IWorkspaceUploadParams extends IUploadCommonParams {
  parent?: WorkspaceParentItem;
  public?: boolean;
}

type IEntcoreWorkspaceDocument = {
  _id: string;
  name: string;
  metadata: {
    name: 'file';
    filename: string;
    'content-type': string;
    'content-transfer-encoding': string;
    charset: 'UTF-8';
    size: number;
  };
  deleted: boolean;
  eParent: string | null;
  eType: 'file';
  file: string;
  shared: [];
  inheritedShares: [];
  created: string;
  modified: string;
  owner: string;
  ownerName: string;
  thumbnails: { [id: string]: string };
  public?: boolean;
};

export type IEntcoreWorkspaceFolder = {
  _id: string;
  created: string;
  modified: string;
  owner: string;
  ownerName: string;
  name: string;
  application: string;
  shared: [];
  ancestors: [];
  deleted: boolean;
  eParent: string | null;
  eType: string;
  externalId: string;
  inheritedShares: [];
  parents: [];
};

type IEntcoreWorkspaceFile = IEntcoreWorkspaceDocument | IEntcoreWorkspaceFolder;
type IEntcoreWorkspaceFileList = IEntcoreWorkspaceFile[];

const workspaceFileAdapter = (file: IEntcoreWorkspaceDocument | IEntcoreWorkspaceFolder | any) => {
  const ret = file.metadata
    ? {
        contentType: file.metadata['content-type'],
        date: moment(file.modified, 'YYYY-MM-DD HH:mm.ss.SSS').toDate().getTime(),
        id: file._id,
        key: file._id,
        isFolder: false,
        name: file.name,
        owner: file.owner as Filter,
        ownerName: file.ownerName,
        size: file.metadata.size,
        url: `/workspace/document/${file._id}`,
      }
    : {
        date: moment(file.modified, 'YYYY-MM-DD HH:mm.ss.SSS').toDate().getTime(),
        id: file._id,
        key: file._id,
        isFolder: true,
        name: file.name,
        owner: file.owner as Filter,
        ownerName: file.ownerName,
      };
  return ret as IFile;
};

const i18nFolderName = {
  [Filter.OWNER]: 'workspace-filelist-owner',
  [Filter.PROTECTED]: 'workspace-filelist-protected',
  [Filter.ROOT]: 'workspace-filelist-root',
  [Filter.SHARED]: 'workspace-filelist-shared',
  [Filter.TRASH]: 'workspace-filelist-trash',
};

export const factoryRootFolder = (filter: Filter): IFile => {
  return {
    id: filter,
    key: filter,
    date: 0,
    isFolder: true,
    name: I18n.get(i18nFolderName[filter]),
    owner: '',
    ownerName: '',
    parentId: 'root',
  };
};

const compareFiles = (a: IFile, b: IFile): number => {
  if (a.isFolder !== b.isFolder) {
    return a.isFolder ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
};

const getImplicitWorkspaceUploadParams = (params: IWorkspaceUploadParams) => {
  return !params?.parent ? {} : implicitWorkspaceUploadParams[params.parent] || { parentId: params.parent };
};

const getThumbnailWorkspaceUploadParams = () => {
  return {
    quality: '1',
    thumbnail: [
      '100x100',
      '120x120',
      '150x150',
      '2600x0',
      `${UI_SIZES.standardScreen.width / 2}x0`,
      `${UI_SIZES.standardScreen.width}x0`,
      `${IMAGE_MAX_DIMENSION}x0`,
    ],
  };
};

const workspaceService = {
  files: {
    get: async (session: AuthLoggedAccount, filter: Filter, parentId: string) => {
      let params = `?filter=${filter}`;

      if (!Object.values(Filter).includes(parentId as Filter)) {
        params += `&parentId=${parentId}`;
      }
      if (filter === Filter.SHARED && parentId === 'shared') {
        params += '&directShared=true';
      }
      params += '&includeall=true';
      const api = `/workspace/documents${params}`;
      const files = (await fetchJSONWithCache(api)) as IEntcoreWorkspaceFileList;
      return files.map(file => workspaceFileAdapter(file)).sort(compareFiles) as IFile[];
    },
    copy: async (session: AuthLoggedAccount, parentId: string, ids: string[], destinationId: string) => {
      destinationId = destinationId === 'owner' ? 'root' : destinationId;
      const api = `/workspace/documents/copy/${destinationId}`;
      const body = JSON.stringify({ parentId, ids });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'POST',
        body,
      });
    },
    move: async (session: AuthLoggedAccount, parentId: string, ids: string[], destinationId: string) => {
      destinationId = destinationId === 'owner' ? 'root' : destinationId;
      const api = `/workspace/documents/move/${destinationId}`;
      const body = JSON.stringify({ parentId, ids });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
    restore: async (session: AuthLoggedAccount, parentId: string, ids: string[]) => {
      const api = '/workspace/documents/restore';
      const body = JSON.stringify({ parentId, ids });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
    trash: async (session: AuthLoggedAccount, ids: string[], parentId?: string) => {
      const api = '/workspace/documents/trash';
      const body = JSON.stringify({ parentId, ids });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
    delete: async (session: AuthLoggedAccount, parentId: string, ids: string[]) => {
      const api = '/workspace/documents';
      const body = JSON.stringify({ parentId, ids });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'DELETE',
        body,
      });
    },
    startUploadFiles: (
      session: AuthLoggedAccount,
      files: LocalFile[],
      params: IWorkspaceUploadParams,
      callbacks?: IUploadCallbaks,
    ) => {
      return files.map(f => workspaceService.file.startUploadFile(session, f, params, callbacks));
    },
    uploadFiles: (session: AuthLoggedAccount, files: LocalFile[], params: IWorkspaceUploadParams, callbacks?: IUploadCallbaks) => {
      return Promise.all(workspaceService.files.startUploadFiles(session, files, params, callbacks).map(j => j.promise));
    },
  },
  file: {
    rename: async (session: AuthLoggedAccount, id: string, name: string) => {
      const api = `/workspace/rename/${id}`;
      const body = JSON.stringify({ name });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
    startUploadFile: (session: AuthLoggedAccount, file: LocalFile, params: IWorkspaceUploadParams, callbacks?: IUploadCallbaks) => {
      const api = '/workspace/document';
      const queryParams = params.public
        ? {
            application: 'media-library',
            quality: 1,
            public: true,
          }
        : {
            parent: params.parent,
            ...getImplicitWorkspaceUploadParams(params),
            //...getThumbnailWorkspaceUploadParams(),
          };
      const url = queryString.stringifyUrl({
        url: api,
        query: queryParams,
      });
      const adapter = (data: any) => {
        const datajson = JSON.parse(data) as IEntcoreWorkspaceDocument;
        const id = datajson._id;
        return {
          ...file,
          id,
          url: datajson.public ? `/workspace/pub/document/${id}` : `/workspace/document/${id}`,
          filesize: datajson.metadata?.size,
          filename: datajson.name || file.filename,
        };
      };
      return fileTransferService.startUploadFile<SyncedFileWithId>(session, file, { ...params, url }, adapter, callbacks);
    },
    uploadFile: (session: AuthLoggedAccount, file: LocalFile, params: IWorkspaceUploadParams, callbacks?: IUploadCallbaks) => {
      return workspaceService.file.startUploadFile(session, file, params, callbacks).promise;
    },
  },
  folders: {
    list: async (session: AuthLoggedAccount) => {
      const api = '/workspace/folders/list?filter=owner&hierarchical=true';
      const folders = (await fetchJSONWithCache(api)) as IEntcoreWorkspaceFolder[];
      return workspaceFolderListAdapter(folders);
    },
  },
  folder: {
    create: async (session: AuthLoggedAccount, name: string, parentId: string) => {
      const api = '/workspace/folder';
      const body = queryString.stringify({
        name,
        externalId: '',
        ...(parentId !== 'owner' ? { parentFolderId: parentId } : {}),
      });
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      };
      const folder = (await signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'POST',
        body,
        headers,
      })) as Promise<IEntcoreWorkspaceFolder>;
      return workspaceFileAdapter(folder);
    },
    rename: async (session: AuthLoggedAccount, id: string, name: string) => {
      const api = `/workspace/folder/rename/${id}`;
      const body = JSON.stringify({ name });
      return signedFetchJson(`${session?.platform.url}${api}`, {
        method: 'PUT',
        body,
      });
    },
  },
};

export const computeVideoThumbnail = (id: string, size?: number[]) => {
  const session = assertSession();
  return `${session.platform.url}/workspace/document/${id}${size && size[0] && size[1] ? `?thumbnail=${size[0]}x${size[1]}` : ''}`;
};

export default workspaceService;
