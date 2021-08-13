/**
 * File Manager
 */

import { Platform } from "react-native";
import DocumentPicker, { DocumentPickerResponse, PlatformTypes } from "react-native-document-picker";
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import type { UploadFileItem } from "react-native-fs";
import FileViewer from 'react-native-file-viewer';
import getPath from "@flyerhq/react-native-android-uri-path";

namespace LocalFile {

    export type IPickOptionsType = 'image' | 'audio' | 'video';
    export interface IPickOptions {
        source: 'documents' | 'galery' | 'camera',
        multiple?: boolean, // Useless for source = 'camera'
        type?: IPickOptionsType | IPickOptionsType[]
    }

    export type CustomUploadFileItem = Omit<UploadFileItem, 'name'>;
}

/**
 * Represent a file that exists on the user's device.
 */
export class LocalFile implements LocalFile.CustomUploadFileItem {

    static _getDocumentPickerTypeArg<OS extends keyof PlatformTypes>(type: LocalFile.IPickOptionsType | LocalFile.IPickOptionsType[] | undefined)
        : Array<PlatformTypes[OS][keyof PlatformTypes[OS]]> {
        const getType = (type: LocalFile.IPickOptionsType) => Platform.select(({
            'image': { ios: 'public.image', android: 'image/*' },
            'audio': { ios: 'public.audio', android: 'audio/*' },
            'video': { ios: 'public.movie', android: 'video/*' }
        }[type]))! as unknown as PlatformTypes[OS][keyof PlatformTypes[OS]]; // Assumes OS is either iOS or Android.

        return type !== undefined
            ? Array.isArray(type)
                ? type.map(t => getType(t))
                : [getType(type)]
            : [Platform.select({ ios: 'public.item', android: '*/*' })! as unknown as PlatformTypes[OS][keyof PlatformTypes[OS]]]
    }

    static _getImagePickerTypeArg(type: LocalFile.IPickOptionsType | LocalFile.IPickOptionsType[] | undefined)
        : MediaType {
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
    static async pick(opts: LocalFile.IPickOptions) {
        let pickedFiles: Array<DocumentPickerResponse | Asset> = [];
        if (opts.source === 'documents') {
            if (opts.multiple) {
                // console.log("Document multiple picker")
                pickedFiles = await DocumentPicker.pickMultiple({
                    type: LocalFile._getDocumentPickerTypeArg(opts.type),
                    mode: 'open'
                });
            } else {
                // console.log("Document single picker")
                pickedFiles = [await DocumentPicker.pick({
                    type: LocalFile._getDocumentPickerTypeArg(opts.type),
                    mode: 'open'
                })];
            }
        } else if (opts.source === 'galery') {
            await new Promise<void>((resolve, reject) => {
                const callback = (res: ImagePickerResponse) => {
                    if (!res.assets || res.didCancel || res.errorCode) reject(res);
                    else {
                        pickedFiles = res.assets;
                        resolve();
                    };
                };
                if (opts.multiple) {
                    // console.log("Galery multiple picker")
                    launchImageLibrary({
                        mediaType: LocalFile._getImagePickerTypeArg(opts.type),
                        selectionLimit: 0
                    }, callback);
                } else {
                    // console.log("Galery single picker")
                    launchImageLibrary({
                        mediaType: LocalFile._getImagePickerTypeArg(opts.type),
                    }, callback);
                }
            });
        } else /* if (opts.source === 'camera') */ {
            await new Promise<void>((resolve, reject) => {
                const callback = (res: ImagePickerResponse) => {
                    if (!res.assets || res.didCancel || res.errorCode) reject(res);
                    else {
                        pickedFiles = res.assets;
                        resolve();
                    };
                };
                // console.log("Camera (single) picker")
                launchCamera({
                    mediaType: LocalFile._getImagePickerTypeArg(opts.type),
                    saveToPhotos: false
                }, callback);
            });
        }
        // console.log(pickedFiles);

        // format pickedFiles data
        const res: LocalFile[] = pickedFiles.map(f => new LocalFile(f, { _needIOSReleaseSecureAccess: opts.source === 'documents' }));
        // console.log("res picked files", res);
        return res;
    }

    filename: string;           // Name of the file including extension
    filepath: string;           // Absolute url to the file on the device, starting by '/'
    _filepathNative: string;    // Absolute url to the file on the device, including 'file://' protocol.
    filetype: string;           // Mime type of the file
    nativeInfo?: DocumentPickerResponse | Asset;    // Backup of the full information given by react-native-fs
    _needIOSReleaseSecureAccess?: boolean;          // Recommended by react-native-fs. A LocalFile created with pick() must be free when it's no more used.

    constructor(file: DocumentPickerResponse | Asset | LocalFile.CustomUploadFileItem, opts: {
        _needIOSReleaseSecureAccess: boolean
    }) {
        this._needIOSReleaseSecureAccess = opts._needIOSReleaseSecureAccess
        this.filename = (file as LocalFile.CustomUploadFileItem).filename;
        this._filepathNative = (file as LocalFile.CustomUploadFileItem).filepath || (file as DocumentPickerResponse | Asset).uri!
        this.filepath = LocalFile.formatUrlForUpload(this._filepathNative);
        this.filetype = (file as LocalFile.CustomUploadFileItem).filetype || (file as DocumentPickerResponse | Asset).type!;
        if ((file as LocalFile.CustomUploadFileItem).filepath) { this.nativeInfo = file as DocumentPickerResponse | Asset; }
    }

    /**
     * Recommended by react-native-fs. Call this function when the LocalFile is not useful anymore.
     * (BtW, you must call this manually because TS does not offer destructors for his objects)
     */
    releaseIfNeeded = () => {
        this._needIOSReleaseSecureAccess && DocumentPicker.releaseSecureAccess([this._filepathNative]);
        this._needIOSReleaseSecureAccess = false;
    }

    static releaseLocalFiles(files: LocalFile[]) {
        files.forEach(f => { f.releaseIfNeeded() });
    }

    /** Functions to parse URLs. You shouldn't have to use them manually. */
    static removeProtocol = (url: string) => url.replace(/^\w*?:\/\/(.+)/, "$1");
    static formatUrlForUpload = (url: string) => Platform.select({
        ios: decodeURI(LocalFile.removeProtocol(url)),
        default: decodeURI(LocalFile.removeProtocol(getPath(url)))
    }) || url;

    /**
     * Opens the file with the native device's reader.
     */
    open () {
        // console.log("openning", this._filepathNative);
        FileViewer.open(this._filepathNative, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
        })
        .then(() => {})
        .catch(error => {
            console.warn("Error opening file", error);
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

/**
 * A SyncedFile is both a LocalFile and a DistantFile. This class wraps up functionality of these two entities.
 */
export class SyncedFile implements LocalFile, IDistantFile {
    filename: string;
    filepath: string;
    _filepathNative: string;
    filetype: string;
    nativeInfo?: DocumentPickerResponse | Asset;
    _needIOSReleaseSecureAccess?: boolean;
    url: string;
    filesize?: number;

    constructor (localFile: LocalFile, distantFile: IDistantFile) {
        this.filename = localFile.filename;
        this.filepath = localFile.filepath;
        this._filepathNative = localFile._filepathNative;
        this.url = distantFile.url;
        this.filetype = localFile.filetype;
        this.filesize = distantFile.filesize;
        const { url, filesize, filetype, filename, ...additionalFields} = distantFile;
        Object.assign(this, additionalFields);
    }

    releaseIfNeeded = LocalFile.prototype.releaseIfNeeded;
    open = LocalFile.prototype.open;
}