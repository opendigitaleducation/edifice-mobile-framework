import Filesize from 'filesize';
import I18n from 'i18n-js';
import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, View, ViewStyle } from 'react-native';
import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';
import Permissions, { PERMISSIONS } from 'react-native-permissions';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture/Icon';
import { SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { IDistantFile, IDistantFileWithId, LocalFile, SyncedFile } from '~/framework/util/fileHandler';
import { openDocument } from '~/framework/util/fileHandler/actions';
import fileTransferService from '~/framework/util/fileHandler/service';
import Notifier from '~/infra/notifier/container';
import { urlSigner } from '~/infra/oauth';

import { IconButton } from './IconButton';

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
const attachmentIconsByFileExt: {
  exts: string[];
  icon: string;
}[] = [
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
    // eslint-disable-next-line no-bitwise
    .slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
    .toLowerCase();

  let icon: string = defaultAttachmentIcon; // default returned value if no one match
  attachmentIconsByFileExt.forEach(type => {
    if (type.exts.includes(ext)) icon = type.icon;
  });

  return icon;
};

const openFile = (notifierId: string, file: SyncedFile | undefined) => {
  return dispatch => {
    if (file) {
      try {
        file.open();
      } catch {
        Toast.showError(I18n.t('download-error-generic'));
      }
    }
  };
};
let lastToast;
const downloadFile = (notifierId: string, file?: SyncedFile, toastMessage?: string) => {
  return dispatch => {
    if (file) {
      try {
        file.mirrorToDownloadFolder();
        //Toast.hide(lastToast);
        lastToast = Toast.showSuccess(toastMessage ?? I18n.t('download-success-name', { name: file.filename }));
      } catch {
        Toast.showError(I18n.t('download-error-generic'));
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
    onOpenFile: (notifierId: string, file: LocalFile | undefined, navigation: NavigationInjectedProps['navigation']) => void;
    onDownloadFile: (notifierId: string, file?: LocalFile, toastMessage?: string) => void;
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

  public async componentDidUpdate(prevProps: any) {
    const { starDownload } = this.props;
    const { downloadState } = this.state;
    const canDownload = this.attId && downloadState !== DownloadState.Success && downloadState !== DownloadState.Downloading;
    const notifierId = `attachment/${this.attId}`;
    if (prevProps.starDownload !== starDownload) {
      if (canDownload) {
        await this.startDownload(this.props.attachment as IRemoteAttachment, lf => {
          requestAnimationFrame(() => {
            if (this.props.onDownloadFile) this.props.onDownloadFile(notifierId, lf, I18n.t('download-success-all'));
          });
        }).catch(() => {
          // TODO: Manage error
        });
      }
    }
  }

  public render() {
    const { attachment: att, style, editMode, onDownloadFile } = this.props;
    const { downloadState } = this.state;
    const notifierId = `attachment/${this.attId}`;

    return (
      <View style={{ ...style }}>
        <Notifier id={notifierId} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
          }}>
          <Pressable
            style={{ flexDirection: 'row', flex: 1 }}
            onPress={() => this.onPressAttachment(notifierId, this.props.navigation)}>
            <View>
              {downloadState === DownloadState.Downloading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.palette.primary.regular}
                  style={{ marginRight: UI_SIZES.spacing.tiny, height: 18 }}
                />
              ) : downloadState === DownloadState.Success ? (
                <Icon
                  color={theme.palette.status.success.regular}
                  size={16}
                  name="checked"
                  style={{ marginRight: UI_SIZES.spacing.minor }}
                />
              ) : !this.attId || downloadState === DownloadState.Error ? (
                <Icon
                  color={theme.palette.status.failure.regular}
                  size={16}
                  name="close"
                  style={{ marginRight: UI_SIZES.spacing.minor }}
                />
              ) : (
                <Icon
                  color={theme.ui.text.regular}
                  size={16}
                  name={getAttachmentTypeByExt(
                    (editMode && (att as ILocalAttachment).name) ||
                      (att as IRemoteAttachment).filename ||
                      (att as IRemoteAttachment).displayName ||
                      '',
                  )}
                  style={{ marginRight: UI_SIZES.spacing.minor }}
                />
              )}
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {downloadState === DownloadState.Error ? (
                <SmallText style={{ color: theme.palette.status.failure.regular }}>{I18n.t('download-error') + ' '}</SmallText>
              ) : null}
              <SmallText style={{ flex: 1 }} ellipsizeMode="middle" numberOfLines={1}>
                <SmallText
                  style={{
                    textDecorationColor: downloadState === DownloadState.Success ? theme.ui.text.regular : theme.ui.text.light,
                    color: downloadState === DownloadState.Success ? theme.ui.text.regular : theme.ui.text.light,
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'solid',
                  }}>
                  {(editMode && (att as ILocalAttachment).name) ||
                    (att as IRemoteAttachment).filename ||
                    (att as IRemoteAttachment).displayName ||
                    I18n.t('download-untitled')}
                  {!this.attId && I18n.t('download-invalidUrl')}
                </SmallText>
                <SmallText style={{ color: theme.ui.text.light, flex: 0 }}>
                  {downloadState === DownloadState.Success
                    ? ' ' + I18n.t('download-open')
                    : downloadState === DownloadState.Error
                    ? ' ' + I18n.t('tryagain')
                    : (this.props.attachment as IRemoteAttachment).size
                    ? `${Filesize((this.props.attachment as IRemoteAttachment).size!, { round: 1 })}`
                    : ''}
                </SmallText>
              </SmallText>
            </View>
          </Pressable>
          {Platform.OS !== 'ios' ? (
            <View>
              {!editMode ? (
                <RNGHTouchableOpacity
                  onPress={async () => {
                    await this.startDownload(this.props.attachment as IRemoteAttachment, lf => {
                      requestAnimationFrame(() => {
                        if (onDownloadFile) onDownloadFile(notifierId, lf);
                      });
                    }).catch(() => {
                      // TODO: Manage error
                    });
                  }}
                  style={{ paddingLeft: UI_SIZES.spacing.small }}>
                  <IconButton
                    iconName="download"
                    iconColor={theme.palette.grey.black}
                    buttonStyle={{ backgroundColor: theme.palette.grey.fog }}
                  />
                </RNGHTouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  public async onPressAttachment(notifierId: string, navigation: NavigationInjectedProps['navigation']) {
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
    if (!this.attId) {
      return undefined;
    } else if (editMode || downloadState === DownloadState.Success) {
      if (Platform.OS === 'android') {
        await Permissions.request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      }
      if (onOpen) onOpen();
      if ((fileType && fileType.startsWith('image')) || fileType === 'picture') {
        try {
          if (file) await openDocument(file, navigation);
        } catch (error) {
          console.log(error);
        }
      } else {
        onOpenFile(notifierId, file, navigation);
      }
    } else {
      this.startDownload(attachment as IRemoteAttachment).catch(() => {
        /*TODO: Manage error*/
      });
    }
  }

  public async startDownload(att: IRemoteAttachment, callback?: (lf: LocalFile) => void) {
    const url = urlSigner.getRelativeUrl(att.url);
    if (!url) throw new Error('[Attachment] url invalid');
    const df: IDistantFileWithId = {
      ...att,
      filetype: att.contentType,
      id: att.id!,
      filesize: att.size,
      filename: att.filename || att.displayName,
      url,
    };

    this.setState({
      downloadState: DownloadState.Downloading,
    });
    const downloadAction = (att: IDistantFile) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => {
      const session = getSession();
      if (!session) return;
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
          if (this.props.onDownload) this.props.onDownload();
          this.setState({
            downloadState: DownloadState.Success,
            progress: 1,
          });
          if (callback) callback(lf);
        })
        .catch(() => {
          if (this.props.onError) this.props.onError();
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
  onDownloadFile: (notifierId: string, file: LocalFile, toastMessage?: string) =>
    dispatch(downloadFile(notifierId, file, toastMessage)),
  dispatch,
}))(Attachment);
