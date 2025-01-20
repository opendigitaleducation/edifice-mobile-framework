/**
 * File Manager
 */
import { Alert, Platform } from 'react-native';

import ImageResizer, { Response } from '@bam.tech/react-native-image-resizer';
import getPath from '@flyerhq/react-native-android-uri-path';
import moment from 'moment';
import DeviceInfo from 'react-native-device-info';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { copyFile, DownloadDirectoryPath, UploadFileItem } from 'react-native-fs';
import ImagePicker, { Image } from 'react-native-image-crop-picker';

import { openDocument } from './actions';
import { Asset } from './types';

import { I18n } from '~/app/i18n';
import { ImagePicked } from '~/framework/components/menus/actions';
import toast from '~/framework/components/toast';
import { assertPermissions } from '~/framework/util/permissions';

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
export const IMAGE_MAX_QUALITY = 80;

const processImage = async (pic: Image) => {
  try {
    const response: Response = await ImageResizer.createResizedImage(
      pic.path,
      IMAGE_MAX_DIMENSION,
      IMAGE_MAX_DIMENSION,
      'JPEG',
      IMAGE_MAX_QUALITY,
      0,
      undefined,
      false,
      {
        mode: 'contain',
        onlyScaleDown: false,
      },
    );
    return {
      ...response,
      fileName: `${moment().format('YYYYMMDD-HHmmss')}.jpg`,
      fileSize: response.size,
      name: `${moment().format('YYYYMMDD-HHmmss')}.jpg`,
      originalPath: response.path,
      type: 'image/jpeg',
    } as Asset;
  } catch (err) {
    console.error('Image resizing failed: ', (err as Error).message);
  }
};

const processImages = (pics: Image[]) => {
  const picsToConvert = pics.length ? pics : [pics];
  return Promise.all(picsToConvert.map(pic => processImage(pic)));
};

/**
 * Represent a file that exists on the user's device.
 */
export class LocalFile implements LocalFile.CustomUploadFileItem {
  static async imageCallback(images: LocalFile[], callback, synchrone, callbackOnce: boolean = false) {
    try {
      const formattedImages = images.map(img => ({ ...img.nativeInfo, ...img })) as ImagePicked[];
      if (callbackOnce) {
        if (synchrone) await callback!(formattedImages);
        else callback!(formattedImages);
      } else {
        for (const image of formattedImages) {
          if (synchrone) await callback(image);
          else callback(image);
        }
      }
    } catch (error) {
      console.error('Error in imageCallback:', error);
    }
  }

  static async documentCallback(files: DocumentPickerResponse[], callback, synchrone) {
    try {
      for (const file of files) {
        file.uri = Platform.select({
          android: getPath(file.uri),
          default: decodeURI(file.uri.indexOf('file://') > -1 ? file.uri.split('file://')[1] : file.uri),
        });
        const fileData = { fileName: file.name!, fileSize: file.size!, type: file.type, uri: file.uri };
        if (synchrone) await callback!(fileData);
        else callback!(fileData);
      }
    } catch (error) {
      console.error('Error in documentCallback:', error);
    }
  }

  static async pickFromDocuments(callback, synchrone) {
    try {
      await assertPermissions('documents.read');
      DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        type: DocumentPicker.types.allFiles,
      }).then(files => {
        this.documentCallback(files, callback, synchrone);
      });
    } catch {
      Alert.alert(
        I18n.get('document-permissionblocked-title'),
        I18n.get('document-permissionblocked-text', { appName: DeviceInfo.getApplicationName() }),
      );
    }
  }

  static async pickFromGallery(callback, multiple: boolean, synchrone, callbackOnce) {
    let pickedFiles: Asset[] = [];
    try {
      await assertPermissions('galery.read');
      const pics = await ImagePicker.openPicker({
        maxFiles: 0,
        multiple, // Default value is 5 somewhere in the third-party package, so we must set it to 0 here to allow unlimited selection.
      });

      pickedFiles = await processImages(pics);

      const res: LocalFile[] = pickedFiles.map(f => new LocalFile(f, { _needIOSReleaseSecureAccess: false }));

      if (Platform.OS === 'android') {
        res.forEach(item => {
          if (item.filetype.startsWith('video/')) {
            toast.showError(I18n.get('pickfile-error-filetype'));
          }
        });
      }
      const images = res.filter(item => !item.filetype.startsWith('video/'));

      await this.imageCallback(images, callback, synchrone, callbackOnce);
    } catch (e) {
      console.error(e);
      Alert.alert(
        I18n.get('gallery-readpermissionblocked-title'),
        I18n.get('gallery-readpermissionblocked-text', { appName: DeviceInfo.getApplicationName() }),
      );
    }
  }

  static async pickFromCamera(callback, useFrontCamera?: boolean, synchrone?: boolean, callbackOnce?: boolean) {
    try {
      let pickedFile: Asset[] = [];
      await assertPermissions('camera');
      const pic = await ImagePicker.openCamera({
        useFrontCamera,
      });
      const compressPic = (await processImage(pic)) as Asset;
      pickedFile = [compressPic];
      const image: LocalFile[] = pickedFile.map(f => new LocalFile(f, { _needIOSReleaseSecureAccess: false }));
      await this.imageCallback(image, callback, synchrone, callbackOnce);
    } catch (e) {
      if (e instanceof Error && (e as { code?: unknown }).code === 'E_PICKER_CANCELLED') {
        await this.imageCallback([], callback, synchrone, callbackOnce);
        return;
      }
      Alert.alert(
        I18n.get('camera-permissionblocked-title'),
        I18n.get('camera-permissionblocked-text', { appName: DeviceInfo.getApplicationName() }),
      );
    }
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
      default: decodeURI(LocalFile.removeProtocol(getPath(url))),
      ios: decodeURI(LocalFile.removeProtocol(url)),
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
    const splitFilename = this.filename.split('.');
    const ext = splitFilename.pop();
    let destPath = `${destFolder}/${splitFilename.join('.')}-${moment().format('YYYYMMDD-HHmmss')}.${ext}`;
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
