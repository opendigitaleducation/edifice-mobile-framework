import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, View, ViewStyle } from 'react-native';

import { filesize } from 'filesize';
import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';
import Permissions, { PERMISSIONS } from 'react-native-permissions';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { IconButton } from './IconButton';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getSession } from '~/framework/modules/auth/reducer';
import { IDistantFile, IDistantFileWithId, LocalFile, SyncedFile } from '~/framework/util/fileHandler';
import { openDocument } from '~/framework/util/fileHandler/actions';
import fileTransferService from '~/framework/util/fileHandler/service';
import Notifier from '~/framework/util/notifier';
import { urlSigner } from '~/infra/oauth';

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
        Toast.showError(I18n.get('attachment-download-error'));
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
        lastToast = Toast.showSuccess(toastMessage ?? I18n.get('attachment-downloadsuccess-name', { name: file.filename }));
      } catch {
        Toast.showError(I18n.get('attachment-download-error'));
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
            if (this.props.onDownloadFile) this.props.onDownloadFile(notifierId, lf, I18n.get('attachment-downloadsuccess-all'));
          });
        }).catch(() => {
          // TODO: Manage error
        });
      }
    }
  }

  public render() {
    const { attachment: att, editMode, onDownloadFile, style } = this.props;
    const { downloadState } = this.state;
    const notifierId = `attachment/${this.attId}`;

    return (
      <View style={{ ...style }}>
        <Notifier id={notifierId} />
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.palette.grey.white,
            borderColor: theme.palette.grey.pearl,
            borderRadius: UI_SIZES.radius.mediumPlus,
            borderWidth: UI_SIZES.elements.border.thin,
            flexDirection: 'row',
            paddingHorizontal: UI_SIZES.spacing.small,
            paddingVertical: UI_SIZES.spacing.minor,
          }}>
          <Pressable
            style={{ alignItems: 'center', flex: 1, flexDirection: 'row' }}
            onPress={() => this.onPressAttachment(notifierId, this.props.navigation)}>
            <View>
              {downloadState === DownloadState.Downloading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.palette.primary.regular}
                  style={{ height: 18, marginRight: UI_SIZES.spacing.tiny }}
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
                <SmallText style={{ color: theme.palette.status.failure.regular }}>{I18n.get('download-error') + ' '}</SmallText>
              ) : null}
              <SmallText style={{ flex: 1 }} ellipsizeMode="middle" numberOfLines={1}>
                <SmallText
                  style={{
                    color: downloadState === DownloadState.Success ? theme.ui.text.regular : theme.ui.text.light,
                    textDecorationColor: downloadState === DownloadState.Success ? theme.ui.text.regular : theme.ui.text.light,
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'solid',
                  }}>
                  {(editMode && (att as ILocalAttachment).name) ||
                    (att as IRemoteAttachment).filename ||
                    (att as IRemoteAttachment).displayName ||
                    I18n.get('attachment-download-untitled')}
                  {!this.attId && I18n.get('attachment-download-invalidurl')}
                </SmallText>
                <SmallText style={{ color: theme.ui.text.light, flex: 0 }}>
                  {downloadState === DownloadState.Success
                    ? ' ' + I18n.get('attachment-download-open')
                    : downloadState === DownloadState.Error
                      ? ' ' + I18n.get('attachment-tryagain')
                      : (this.props.attachment as IRemoteAttachment).size
                        ? `${filesize((this.props.attachment as IRemoteAttachment).size!, { round: 1 })}`
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
    const { attachment, editMode, onOpen, onOpenFile } = this.props;
    const { downloadState, newDownloadedFile } = this.state;
    const fileType = editMode
      ? (attachment as ILocalAttachment).mime
      : (attachment as IRemoteAttachment).contentType || (newDownloadedFile && getAttachmentTypeByExt(newDownloadedFile.filename));
    const toLocalFile = (att: ILocalAttachment) =>
      new LocalFile(
        {
          filename: att.displayName || att.name,
          filepath: att.uri,
          filetype: att.mime,
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
        } catch {
          // TODO: handle error
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
      filename: att.filename || att.displayName,
      filesize: att.size,
      filetype: att.contentType,
      id: att.id!,
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
  dispatch,
  onDownloadFile: (notifierId: string, file: LocalFile, toastMessage?: string) =>
    dispatch(downloadFile(notifierId, file, toastMessage)),
  onOpenFile: (notifierId: string, file: LocalFile) => dispatch(openFile(notifierId, file)),
}))(Attachment);
