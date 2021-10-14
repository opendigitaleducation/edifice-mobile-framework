import I18n from 'i18n-js';
import * as React from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, Text, View, ViewStyle, Platform, Pressable } from 'react-native';
import Permissions, { PERMISSIONS } from 'react-native-permissions';
import Filesize from 'filesize';
import Mime from 'mime';

import { CommonStyles } from '../styles/common/styles';
import { getAuthHeader } from '../infra/oauth';
import { ButtonsOkCancel, Icon } from '.';
import { TouchableOpacity as RNGHTouchableOpacity, TouchableOpacity } from 'react-native-gesture-handler';
import { ModalBox, ModalContent, ModalContentBlock, ModalContentText } from './Modal';
import { notifierShowAction } from '../infra/notifier/actions';
import Notifier from '../infra/notifier/container';
import { IconButton } from './IconButton';
import { mainNavNavigate } from '../navigation/helpers/navHelper';
import { IDistantFile, IDistantFileWithId, LocalFile, SyncedFile } from '../framework/util/fileHandler';
import fileTransferService from '../framework/util/fileHandler/service';
import { ThunkDispatch } from 'redux-thunk';
import { IGlobalState } from '../AppStore';
import { getUserSession } from '../framework/util/session';
import { legacyAppConf } from '../framework/util/appConf';
import Toast from 'react-native-tiny-toast';

export interface IRemoteAttachment {
  charset?: string;
  contentTransferEncoding?: string;
  contentType?: string;
  displayName?: string;
  filename?: string;
  id?: string;
  size?: number; // in Bytes
  url: string;
}

export interface ILocalAttachment {
  mime: string;
  name: string;
  uri: string;
}

export enum DownloadState {
  Idle = 0,
  Downloading,
  Success,
  Error,
}

// const dirs = RNFetchBlob.fs.dirs;
const attachmentIconsByFileExt: Array<{
  exts: string[];
  icon: string;
}> = [
    {
      exts: ['doc', 'docx'],
      icon: 'file-word',
    },
    { exts: ['xls', 'xlsx'], icon: 'file-excel' },
    {
      exts: ['ppt', 'pptx'],
      icon: 'file-powerpoint',
    },
    {
      exts: ['pdf'],
      icon: 'file-pdf',
    },
    {
      exts: ['zip', 'rar', '7z'],
      icon: 'file-archive',
    },
    {
      exts: ['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'bmp', 'heif', 'heic'],
      icon: 'picture',
    },
  ];
const defaultAttachmentIcon = 'attached';
const getAttachmentTypeByExt = (filename: string) => {
  // from https://stackoverflow.com/a/12900504/6111343
  const ext = filename
    // tslint:disable-next-line:no-bitwise
    .slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
    .toLowerCase();

  let icon: string = defaultAttachmentIcon; // default returned value if no one match
  attachmentIconsByFileExt.map(type => {
    if (type.exts.includes(ext)) icon = type.icon;
  });

  return icon;
};

const openFile = (notifierId: string, file?: SyncedFile) => {
  return dispatch => {
    if (file) {
      file.open();
    }
  };
};
const downloadFile = (notifierId: string, file?: SyncedFile) => {
  return dispatch => {
    if (file) {
      try {
        // console.log('DOWNLOAD FILE', file);
        file.mirrorToDownloadFolder();
        Toast.showSuccess(I18n.t("download-success-name", { name: file.filename }));
      } catch (e) {
        Toast.show(I18n.t("download-error-generic"));
      }
    }
  };
};
class Attachment extends React.PureComponent<
  {
    attachment: IRemoteAttachment | ILocalAttachment;
    starDownload: boolean;
    style: ViewStyle;
    editMode?: boolean;
    onRemove?: () => void;
    onOpenFile: (notifierId: string, file?: LocalFile) => void;
    onDownloadFile: (notifierId: string, file?: LocalFile) => void;
    onDownload?: () => void;
    onError?: () => void;
    onOpen?: () => void;
    dispatch: ThunkDispatch<any, any, any>;
  },
  {
    downloadState: DownloadState;
    progress: number; // From 0 to 1
    downloadedFile?: string;
    newDownloadedFile?: SyncedFile;
  }
> {
  get attId() {
    const { attachment, editMode } = this.props;
    return editMode
      ? (attachment as ILocalAttachment).uri && (attachment as ILocalAttachment).uri.split('/').pop()
      : (attachment as IRemoteAttachment).url && (attachment as IRemoteAttachment).url!.split('/').pop();
  }

  public constructor(props) {
    super(props);
    this.state = {
      downloadState: DownloadState.Idle,
      progress: 0,
    };
  }

  public componentDidUpdate(prevProps: any) {
    const { starDownload, attachment } = this.props;
    const { downloadState } = this.state;
    const canDownload = this.attId && downloadState !== DownloadState.Success && downloadState !== DownloadState.Downloading;
    if (prevProps.starDownload !== starDownload) {
      canDownload && this.startDownload(attachment as IRemoteAttachment).catch(err => console.log(err));
    }
  }

  public render() {
    const { attachment: att, style, editMode, onRemove, onDownloadFile } = this.props;
    const { downloadState, progress } = this.state;
    const notifierId = `attachment/${this.attId}`;

    return (
      <View style={{...style}}>
        <Notifier id={notifierId} />
        <View style={{
          flexDirection: 'row', alignItems: "center", height: 30
        }}>
          <Pressable style={{flexDirection: 'row', flex: 1}}
            onPress={() => this.onPressAttachment(notifierId)}>
            <View>
              {downloadState === DownloadState.Downloading ? (
                <ActivityIndicator size="small" color={CommonStyles.primary} style={{ marginRight: 4, height: 18 }} />
              ) : downloadState === DownloadState.Success ? (
                <Icon color={CommonStyles.themeOpenEnt.green} size={16} name={'checked'} style={{ marginRight: 8 }} />
              ) : !this.attId || downloadState === DownloadState.Error ? (
                <Icon color={CommonStyles.errorColor} size={16} name={'close'} style={{ marginRight: 8 }} />
              ) : (
                <Icon
                  color={CommonStyles.textColor}
                  size={16}
                  name={getAttachmentTypeByExt(
                    (editMode && (att as ILocalAttachment).name) ||
                    (att as IRemoteAttachment).filename ||
                    (att as IRemoteAttachment).displayName ||
                    '',
                  )}
                  style={{ marginRight: 8 }}
                />
              )}
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {downloadState === DownloadState.Error ? (
                <Text style={{ color: CommonStyles.errorColor }}>{I18n.t('download-error') + ' '}</Text>
              ) : null}
              <Text style={{ flex: 1 }}
                ellipsizeMode="middle" numberOfLines={1}>
                <Text style={{
                  textDecorationColor: downloadState === DownloadState.Success ? CommonStyles.textColor : CommonStyles.lightTextColor,
                  color: downloadState === DownloadState.Success ? CommonStyles.textColor : CommonStyles.lightTextColor,
                  textDecorationLine: 'underline',
                  textDecorationStyle: 'solid'
                }}>
                  {(editMode && (att as ILocalAttachment).name) ||
                    (att as IRemoteAttachment).filename ||
                    (att as IRemoteAttachment).displayName ||
                    I18n.t('download-untitled')}
                  {!this.attId && I18n.t('download-invalidUrl')}
                </Text>
                <Text
                  style={{
                    color: CommonStyles.lightTextColor,
                    flex: 0,
                  }}>
                  {downloadState === DownloadState.Success
                    ? ' ' + I18n.t('download-open')
                    : downloadState === DownloadState.Error
                      ? ' ' + I18n.t('tryagain')
                      : (this.props.attachment as IRemoteAttachment).size
                        ? `${Filesize((this.props.attachment as IRemoteAttachment).size!, { round: 1 })}`
                        : ''}
                </Text>
              </Text>
            </View>
          </Pressable>
          {Platform.OS !== "ios" ? <View>
            {!editMode ? <RNGHTouchableOpacity onPress={async () => {
              await this.startDownload(this.props.attachment as IRemoteAttachment, (lf => {
                requestAnimationFrame(() => {
                  // console.log("lf", lf);
                  onDownloadFile && onDownloadFile(notifierId, lf)
                });
              })).catch(err => console.log(err));
            }} style={{ paddingLeft: 12 }}>
              <IconButton iconName="download" iconColor="#000000" buttonStyle={{ backgroundColor: CommonStyles.lightGrey }} />
            </RNGHTouchableOpacity> : null}
          </View> : null}
        </View>
      </View>
    );
  }

  public async onPressAttachment(notifierId: string) {
    const { onOpenFile, onOpen, attachment, editMode } = this.props;
    const { downloadState, newDownloadedFile } = this.state;
    const fileType = editMode
      ? (attachment as ILocalAttachment).mime
      : (attachment as IRemoteAttachment).contentType || (newDownloadedFile && getAttachmentTypeByExt(newDownloadedFile.filename));
    const toLocalFile = (att: ILocalAttachment) =>
      new LocalFile(
        {
          filename: att['displayName'] || att.name,
          filetype: att.mime,
          filepath: att.uri,
        },
        { _needIOSReleaseSecureAccess: false },
      ) as LocalFile;
    const file = editMode ? toLocalFile(attachment as ILocalAttachment) : newDownloadedFile;
    const carouselImage =
      Platform.OS === 'android'
        ? [{ src: { uri: 'file://' + file?.filepath }, alt: 'image' }]
        : [{ src: { uri: file?.filepath }, alt: 'image' }];

    if (!this.attId) {
      return undefined;
    } else if (editMode || downloadState === DownloadState.Success) {
      if (Platform.OS === 'android') {
        await Permissions.request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      }
      onOpen && onOpen();
      (fileType && fileType.startsWith('image')) || fileType === 'picture'
        ? mainNavNavigate('carouselModal', { images: carouselImage })
        : onOpenFile(notifierId, file);
    } else {
      this.startDownload(attachment as IRemoteAttachment).catch(err => console.log(err));
    }
  }

  public async startDownload(att: IRemoteAttachment, callback?: (lf: LocalFile) => void) {
    const df: IDistantFileWithId = {
      ...att,
      filetype: att.contentType,
      id: att.id!,
      filesize: att.size,
      filename: att.filename || att.displayName,
      url: att.url.replace(legacyAppConf.currentPlatform?.url!, ''),
    };

    this.setState({
      downloadState: DownloadState.Downloading,
    });
    const downloadAction = (att: IDistantFile) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
      const session = getUserSession(getState());
      fileTransferService
        .downloadFile(
          session,
          att,
          {},
          {
            onProgress: res => {
              this.setState({
                progress: res.bytesWritten / res.contentLength,
              });
            },
          },
        )
        .then(lf => {
          this.setState({ newDownloadedFile: lf });
          this.props.onDownload && this.props.onDownload();
          this.setState({
            downloadState: DownloadState.Success,
            progress: 1,
          });
          callback && callback(lf);
        })
        .catch(e => {
          console.log(e);
          this.props.onError && this.props.onError();
          this.setState({
            downloadState: DownloadState.Error,
            progress: 0,
          });
        });
    };
    this.props.dispatch(downloadAction(df));
  }
}

export default connect(null, dispatch => ({
  onOpenFile: (notifierId: string, file: LocalFile) => dispatch(openFile(notifierId, file)),
  onDownloadFile: (notifierId: string, file: LocalFile) => dispatch(downloadFile(notifierId, file)),
  dispatch,
}))(Attachment);
