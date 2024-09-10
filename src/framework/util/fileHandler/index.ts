/**
 * File Manager
 */
import getPath from '@flyerhq/react-native-android-uri-path';
import moment from 'moment';
import { Platform } from 'react-native';
import DocumentPicker, { DocumentPickerResponse, PlatformTypes } from 'react-native-document-picker';
import { DownloadDirectoryPath, UploadFileItem, copyFile, exists } from 'react-native-fs';
import {
  Asset,
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  MediaType,
  PhotoQuality,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import { getExtension } from '~/framework/util/file';
import { assertPermissions } from '~/framework/util/permissions';

import { openDocument } from './actions';

export interface IPickOptions {
  source: 'documents' | 'galery' | 'camera';
  multiple?: boolean; // Useless for source = 'camera'
  type?: LocalFile.IPickOptionsType | LocalFile.IPickOptionsType[];
}

namespace LocalFile {
  export type IPickOptionsType = 'image' | 'audio' | 'video';

  export type CustomUploadFileItem = Omit<UploadFileItem, 'name'>;
}

export const IMAGE_MAX_DIMENSION = 1440;
export const IMAGE_MAX_QUALITY: PhotoQuality = 0.8;

const compressionOptions = {
  maxHeight: IMAGE_MAX_DIMENSION,
  maxWidth: IMAGE_MAX_DIMENSION,
  quality: IMAGE_MAX_QUALITY,
};

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const renameAssets = (assets: Asset[], type: LocalFile.IPickOptionsType) => {
  const prefix = moment().format('YYYYMMDD-HHmmss');
  const renamedAssets = assets.map((asset, index) => {
    let ext = getExtension(asset.fileName);
    if (type === 'image') ext = '.jpg';
    return {
      ...asset,
      fileName: `${prefix}${index > 0 ? `-${index}` : ''}${ext ?? ''}`,
    };
  });
  return renamedAssets;
};

/**
 * Represent a file that exists on the user's device.
 */
export class LocalFile implements LocalFile.CustomUploadFileItem {
  static _getDocumentPickerTypeArg<OS extends keyof PlatformTypes>(
    type: LocalFile.IPickOptionsType | LocalFile.IPickOptionsType[] | undefined,
  ): PlatformTypes[OS][keyof PlatformTypes[OS]][] {
    const getType = (type: LocalFile.IPickOptionsType) =>
      Platform.select(
        {
          image: { ios: 'public.image', android: 'image/*' },
          audio: { ios: 'public.audio', android: 'audio/*' },
          video: { ios: 'public.movie', android: 'video/*' },
        }[type],
      )! as unknown as PlatformTypes[OS][keyof PlatformTypes[OS]]; // Assumes OS is either iOS or Android.

    return type !== undefined
      ? Array.isArray(type)
        ? type.map(t => getType(t))
        : [getType(type)]
      : [Platform.select({ ios: 'public.item', android: '*/*' })! as unknown as PlatformTypes[OS][keyof PlatformTypes[OS]]];
  }

  static _getImagePickerTypeArg(type: LocalFile.IPickOptionsType | LocalFile.IPickOptionsType[] | undefined): MediaType {
    const typeAsArray = Array.isArray(type) ? type : [type];
    const isImage = typeAsArray.includes('image');
    const isVideo = typeAsArray.includes('video');
    if (isImage || !isVideo) return 'photo';
    if (!isImage || isVideo) return 'video';
    else return 'mixed';
  }

  /**
   * Pick a file from the user's device storage.
   */
  static async pick(
    opts: IPickOptions,
    cameraOptions?: Omit<CameraOptions, 'mediaType'>,
    galeryOptions?: Omit<ImageLibraryOptions, 'mediaType'>,
  ) {
    let pickedFiles: (DocumentPickerResponse | Asset)[] = [];
    if (opts.source === 'documents') {
      // Assert permission
      await assertPermissions('documents.read');
      // Pick files
      if (opts.multiple) {
        pickedFiles = await DocumentPicker.pickMultiple({
          type: LocalFile._getDocumentPickerTypeArg(opts.type),
          presentationStyle: 'fullScreen',
          mode: 'open',
        });
      } else {
        pickedFiles = [
          await DocumentPicker.pickSingle({
            type: LocalFile._getDocumentPickerTypeArg(opts.type),
            presentationStyle: 'fullScreen',
            mode: 'open',
          }),
        ];
      }
    } else if (opts.source === 'galery') {
      // Assert permission
      await assertPermissions('galery.read');
      // Pick files
      await new Promise<void>((resolve, reject) => {
        const callback = async (res: ImagePickerResponse) => {
          if (res.didCancel) {
            pickedFiles = [];
            resolve();
          } else if (!res.assets || res.errorCode) reject(res);
          else {
            pickedFiles = renameAssets(res.assets, 'image');
            resolve();
          }
        };
        launchImageLibrary(
          {
            mediaType: LocalFile._getImagePickerTypeArg(opts.type),
            selectionLimit: opts.multiple ? 0 : 1,
            presentationStyle: 'pageSheet',
            ...compressionOptions,
            ...galeryOptions,
          },
          callback,
        );
      });
    } /* if (opts.source === 'camera') */ else {
      await assertPermissions('camera');
      // Pick files
      await new Promise<void>((resolve, reject) => {
        const callback = async (res: ImagePickerResponse) => {
          if (res.didCancel) {
            pickedFiles = [];
            resolve();
          } else if (!res.assets || res.errorCode) reject(res);
          else {
            pickedFiles = renameAssets(res.assets, 'image');
            resolve();
          }
        };
        launchCamera(
          {
            mediaType: LocalFile._getImagePickerTypeArg(opts.type),
            presentationStyle: 'fullScreen',
            saveToPhotos: false,
            ...compressionOptions,
            ...cameraOptions,
          },
          callback,
        );
      });
    }

    // format pickedFiles data
    const res: LocalFile[] = pickedFiles.map(f => new LocalFile(f, { _needIOSReleaseSecureAccess: opts.source === 'documents' }));
    return res;
  }

  filename: string; // Name of the file including extension

  filepath: string; // Absolute url to the file on the device, starting by '/'

  _filepathNative: string; // Absolute url to the file on the device, including 'file://' protocol.

  filesize?: number;

  filetype: string; // Mime type of the file

  nativeInfo: DocumentPickerResponse | Asset; // Backup of the full information given by react-native-fs

  _needIOSReleaseSecureAccess?: boolean; // Recommended by react-native-fs. A LocalFile created with pick() must be free when it's no more used.

  constructor(
    file: DocumentPickerResponse | Asset | LocalFile.CustomUploadFileItem,
    opts: {
      _needIOSReleaseSecureAccess: boolean;
    },
  ) {
    this._needIOSReleaseSecureAccess = opts._needIOSReleaseSecureAccess;
    this.filename =
      (file as LocalFile.CustomUploadFileItem).filename || (file as DocumentPickerResponse).name || (file as Asset).fileName!;
    this._filepathNative = (file as LocalFile.CustomUploadFileItem).filepath || (file as DocumentPickerResponse | Asset).uri!;
    this.filepath = LocalFile.formatUrlForUpload(this._filepathNative);
    this.filetype = (file as LocalFile.CustomUploadFileItem).filetype || (file as DocumentPickerResponse | Asset).type!;
    this.nativeInfo = file as DocumentPickerResponse | Asset;
  }

  setExtension(ext: string) {
    this.filename += `.${ext}`;
    this.setPath(`${this.filepath}.${ext}`);
  }

  setPath(path: string) {
    this.filename = path.split('/').pop()!;
    this.filepath = path;
    this._filepathNative = path;
  }

  /**
   * Recommended by react-native-fs. Call this function when the LocalFile is not useful anymore.
   * (BtW, you must call this manually because TS does not offer destructors for his objects)
   */
  releaseIfNeeded = () => {
    this._needIOSReleaseSecureAccess && DocumentPicker.releaseSecureAccess([this._filepathNative]);
    this._needIOSReleaseSecureAccess = false;
  };

  static releaseLocalFiles(files: LocalFile[]) {
    files.forEach(f => {
      f.releaseIfNeeded();
    });
  }

  /** Functions to parse URLs. You shouldn't have to use them manually. */
  static removeProtocol = (url: string) => url.replace(/^\w*?:\/\/(.+)/, '$1');

  static formatUrlForUpload = (url: string) =>
    Platform.select({
      ios: decodeURI(LocalFile.removeProtocol(url)),
      default: decodeURI(LocalFile.removeProtocol(getPath(url))),
    }) || url;

  /**
   * Opens the file with the native device's reader.
   */
  async open() {
    // Add "file://" if absolute url is provided
    if (!this.filepath.includes('://')) {
      this.filepath = 'file://' + this.filepath;
      this._filepathNative = 'file://' + this._filepathNative;
    }
    await openDocument(this);
  }

  /**
   * Copy file into user downloads folder
   */
  async mirrorToDownloadFolder() {
    await assertPermissions('documents.write');
    const destFolder = DownloadDirectoryPath;
    let destPath = `${destFolder}/${this.filename}`;
    if (await exists(destPath)) {
      const splitFilename = this.filename.split('.');
      const ext = splitFilename.pop();
      destPath = `${destFolder}/${splitFilename.join('.')}-${moment().format('YYYYMMDD-HHmmss')}.${ext}`;
    }
    copyFile(this.filepath, destPath)
      .then(() => {})
      .catch(error => {
        throw error;
      });
  }
}

/**
 * Represent a file that exists onto the server.
 * Additional information other than url is not mandatory, but recommended.
 */
export interface IDistantFile {
  url: string;
  filename?: string;
  filetype?: string;
  filesize?: number;
}
export interface IDistantFileWithId extends IDistantFile {
  id: string;
}
export interface IAnyDistantFile extends IDistantFile {
  [key: string]: any;
}

/**
 * A SyncedFile is both a LocalFile and a DistantFile. This class wraps up functionality of these two entities.
 */
export class SyncedFile<DFType extends IDistantFile = IDistantFile> implements LocalFile, IDistantFile {
  df: DFType;

  lf: LocalFile;

  constructor(localFile: LocalFile, distantFile: DFType) {
    this.df = distantFile;
    this.lf = localFile;
  }

  get url() {
    return this.df.url;
  }

  get filename() {
    return this.df.filename ?? this.lf.filename;
  }

  get filepath() {
    return this.lf.filepath;
  }

  get filesize() {
    return this.df.filesize;
  }

  get filetype() {
    return this.df.filetype ?? this.lf.filetype;
  }

  get _filepathNative() {
    return this.lf._filepathNative;
  }

  releaseIfNeeded = () => LocalFile.prototype.releaseIfNeeded.call(this.lf);

  open = () => LocalFile.prototype.open.call(this.lf);

  setExtension = (ext: string) => LocalFile.prototype.setExtension.call(this.lf, ext);

  setPath = (path: string) => LocalFile.prototype.setPath.call(this.lf, path);

  mirrorToDownloadFolder = () => LocalFile.prototype.mirrorToDownloadFolder.call(this.lf);
}

export class SyncedFileWithId extends SyncedFile<IDistantFileWithId> {
  get id() {
    return (this.df as IDistantFileWithId).id;
  }
}
