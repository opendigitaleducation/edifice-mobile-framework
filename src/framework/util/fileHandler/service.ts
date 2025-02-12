/**
 * API Consumer for Backend Workspace application
 */

/**
 * TODO :
 * - separate fileTransferService and workspaceService
 * - make standard thunks for upload/download + thunk builder
 */
import mime from 'mime';
import path from 'path';
import RNFS, {
  DownloadBeginCallbackResult,
  DownloadProgressCallbackResult,
  UploadBeginCallbackResult,
  UploadProgressCallbackResult,
} from 'react-native-fs';

import { IAnyDistantFile, IDistantFile, LocalFile, SyncedFile } from '.';

import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { assertPermissions } from '~/framework/util/permissions';
import { getSafeFileName } from '~/framework/util/string';
import { urlSigner } from '~/infra/oauth';

export interface IUploadCommonParams {
  fields?: { [key: string]: string };
  headers?: { [key: string]: string };
  binaryStreamOnly?: boolean;
}
export interface IUploadParams extends IUploadCommonParams {
  url: string;
}

export interface IUploadCallbaks {
  onBegin?: (response: UploadBeginCallbackResult) => void;
  onProgress?: (Response: UploadProgressCallbackResult) => void;
}

export interface IDownloadParams {
  useDownloadManagerAndroid?: boolean; // ToDo: implement this
}

export interface IDownloadCallbaks {
  onBegin?: (response: DownloadBeginCallbackResult) => void;
  onProgress?: (Response: DownloadProgressCallbackResult) => void;
}

// All these non-standard mime types (left) needs to be replaced by the standard values (right).
const mimeAliases = {
  'image/jpg': 'image/jpeg',
  'image/tif': 'image/tiff',
};

const fileTransferService = {
  /** Download a file that exists in the server. */
  downloadFile: async <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    file: IDistantFile,
    params: IDownloadParams,
    callbacks?: IDownloadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    try {
      const job = await fileTransferService.startDownloadFile(session, file, params, callbacks, syncedFileClass);
      return await job.promise;
    } catch (e) {
      throw e;
    }
  },

  downloadFiles: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    files: IDistantFile[],
    params: IDownloadParams,
    callbacks?: IDownloadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    return Promise.all(
      fileTransferService.startDownloadFiles(session, files, params, callbacks, syncedFileClass).map(async j => (await j).promise)
    );
  },

  /** Download a file that exists in the server. This function returns more information than `downloadFile` to better handle file suring download. */
  startDownloadFile: async <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    file: IDistantFile,
    params: IDownloadParams,
    callbacks?: IDownloadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    const sfclass = (syncedFileClass ?? SyncedFile) as new (
      ...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]
    ) => SyncedFileType;
    const fileUrl = urlSigner.getRelativeUrl(file.url)!;
    file.filename = getSafeFileName(file.filename || fileUrl.split('/').pop());
    const folderDest = `${RNFS.DocumentDirectoryPath}${fileUrl}`;
    const downloadDest = `${folderDest}/${file.filename}`;
    const downloadUrl = urlSigner.getAbsoluteUrl(file.url);
    const headers = { ...urlSigner.getAuthHeader() };
    const localFile = new LocalFile(
      {
        filename: file.filename!,
        filepath: 'file://' + downloadDest,
        filetype: file.filetype || 'application/octet-stream',
      },
      {
        _needIOSReleaseSecureAccess: false,
      }
    );
    // If destination folder exists, there may be a file already downloaded.
    const exists = await RNFS.exists(folderDest);
    if (exists) {
      const files = await RNFS.readDir(folderDest);
      const found = files.find(f => {
        return path.parse(f.name).name.normalize() === file.filename?.normalize();
      });
      if (found) {
        localFile.setPath(found.path);
        const foundMime = mime.getType(found.path);
        if (foundMime) localFile.filetype = foundMime;
        return new Promise<{
          jobId: number;
          promise: Promise<SyncedFileType>;
        }>(resolve =>
          resolve({
            jobId: 0,
            promise: new Promise(resolve => resolve(new sfclass(localFile, file))),
          })
        );
      }
    }
    // Assert Permission
    await assertPermissions('documents.write');
    // Create destination folder if needed
    // RNFS Automatically creates parents and does not throw if already exists (works like Linux mkdir -p)
    RNFS.mkdir(folderDest, { NSURLIsExcludedFromBackupKey: true });
    // Download file now!
    const job = RNFS.downloadFile({
      begin: res => {
        if (res.contentLength) {
          file.filesize = res.contentLength;
        }
        if (res?.headers['Content-Type']) {
          const foundType = mimeAliases[res?.headers['Content-Type']] ?? res?.headers['Content-Type'];
          file.filetype = foundType;
          localFile.filetype = foundType;
        }
        callbacks?.onBegin?.(res);
      },
      fromUrl: downloadUrl,
      headers,
      progress: callbacks?.onProgress,
      toFile: downloadDest,
    });
    const newJob = {
      jobId: job.jobId,
      promise: job.promise
        .then(res => {
          if (res.statusCode < 200 || res.statusCode > 299) throw new Error('Download failed: server error ' + JSON.stringify(res));
          // rename local file if file name has no extension and file type is known
          if (localFile.filename.indexOf('.') === -1) {
            // const ext = localFile.filetype.split('/').pop()!;
            const ext = mime.getExtension(localFile.filetype);
            const toMove = localFile.filepath;
            if (ext) {
              localFile.setExtension(ext);
              RNFS.moveFile(toMove, localFile.filepath);
            }
          }
          // return
          return new sfclass(localFile, file);
        })
        .catch(e => {
          throw e;
        }),
    };
    return newJob;
  },

  startDownloadFiles: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    files: IDistantFile[],
    params: IDownloadParams,
    callbacks?: IDownloadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    return files.map(f => fileTransferService.startDownloadFile(session, f, params, callbacks, syncedFileClass));
  },

  /** Upload a file to the given url. This function returns more information than `uploadFile` to better handle file suring upload. */
  startUploadFile: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    file: LocalFile,
    params: IUploadParams,
    adapter: (data: any) => SyncedFileType['df'],
    callbacks?: IUploadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    const url = session.platform.url + params.url;
    const job = RNFS.uploadFiles({
      begin: callbacks?.onBegin,
      binaryStreamOnly: params.binaryStreamOnly,
      fields: { ...params.fields },
      files: [{ ...file, name: 'file' }],
      headers: { ...urlSigner.getAuthHeader(), ...params.headers },
      method: 'POST',
      progress: callbacks?.onProgress,
      toUrl: url,
    });
    const newJob = {
      jobId: job.jobId,
      promise: job.promise
        .then(res => {
          const statusCode = res.statusCode || 0;
          if (statusCode >= 200 && statusCode < 300) {
            const df = adapter(res.body);
            const sfclass = (syncedFileClass ?? SyncedFile) as new (
              ...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]
            ) => SyncedFileType;
            return new sfclass(file, df) as SyncedFileType;
          } else {
            const err = new Error('Upload failed: server error ' + JSON.stringify(res));
            err.response = res;
            throw err;
          }
        })
        .catch(e => {
          throw e;
        }),
    };
    return newJob;
  },

  startUploadFiles: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    files: LocalFile[],
    params: IUploadParams,
    adapter: (data: any) => SyncedFileType['df'],
    callbacks?: IUploadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    return files.map(f => fileTransferService.startUploadFile(session, f, params, adapter, callbacks, syncedFileClass));
  },

  /** Upload a file to the given url. */
  uploadFile: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    file: LocalFile,
    params: IUploadParams,
    adapter: (data: any) => SyncedFileType['df'],
    callbacks?: IUploadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    try {
      const job = fileTransferService.startUploadFile(session, file, params, adapter, callbacks, syncedFileClass);
      return job.promise;
    } catch (e) {
      throw e;
    }
  },

  uploadFiles: <SyncedFileType extends SyncedFile<IAnyDistantFile> = SyncedFile<IAnyDistantFile>>(
    session: AuthLoggedAccount,
    files: LocalFile[],
    params: IUploadParams,
    adapter: (data: any) => SyncedFileType['df'],
    callbacks?: IUploadCallbaks,
    syncedFileClass?: new (...arguments_: [SyncedFileType['lf'], SyncedFileType['df']]) => SyncedFileType
  ) => {
    return Promise.all(
      fileTransferService.startUploadFiles(session, files, params, adapter, callbacks, syncedFileClass).map(j => j.promise)
    );
  },
};

export default fileTransferService;
