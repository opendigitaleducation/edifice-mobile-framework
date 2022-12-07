import I18n from 'i18n-js';
import * as React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import RNConfigReader from 'react-native-config-reader';
import DeviceInfo from 'react-native-device-info';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/AppStore';
import theme from '~/app/theme';
import { ActionButton } from '~/framework/components/action-button';
import { UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyBoldText, HeadingSText, SmallBoldText, SmallText } from '~/framework/components/text';
import workspaceService from '~/framework/modules/workspace/service';
import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { LocalFile, SyncedFile } from '~/framework/util/fileHandler';
import { formatSource } from '~/framework/util/media';
import { IUserSession, getUserSession } from '~/framework/util/session';
import { Trackers } from '~/framework/util/tracker';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { pickFileError } from '~/infra/actions/pickFile';
import { ImagePicked, ImagePicker } from '~/infra/imagePicker';
import { notifierShowAction } from '~/infra/notifier/actions';
import Notifier from '~/infra/notifier/container';
import { OAuth2RessourceOwnerPasswordClient } from '~/infra/oauth';
import { Avatar, Size } from '~/ui/avatars/Avatar';
import { ButtonLine } from '~/ui/button-line';
import { logout } from '~/user/actions/login';
import { profileUpdateAction } from '~/user/actions/profile';
import { IUserInfoState } from '~/user/state/info';

import styles from './styles';

const uploadAvatarError = () => {
  return dispatch => {
    dispatch(
      notifierShowAction({
        id: 'profileOne',
        text: I18n.t('ProfileChangeAvatarErrorUpload'),
        icon: 'close',
        type: 'error',
      }),
    );
    Trackers.trackEvent('Profile', 'UPDATE ERROR', 'AvatarChangeError');
  };
};

// tslint:disable-next-line:max-classes-per-file
export class UserScreen extends React.PureComponent<
  {
    onLogout: () => Promise<void>;
    onUploadAvatar: (avatar: LocalFile) => Promise<SyncedFile>;
    onUpdateAvatar: (uploadedAvatarUrl: string) => Promise<void>;
    onPickFileError: (notifierId: string) => void;
    onUploadAvatarError: () => void;
    userinfo: IUserInfoState;
    session: IUserSession;
    navigation: any;
  },
  {
    showVersionType: boolean;
    updatingAvatar: boolean;
    versionOverride: string;
    versionType: string;
  }
> {
  public state = {
    showVersionType: false,
    updatingAvatar: false,
    versionOverride: RNConfigReader.BundleVersionOverride,
    versionType: RNConfigReader.BundleVersionType,
  };

  showWhoAreWe = this.props.session.platform.showWhoAreWe;

  URISource = this.props.userinfo.photo && formatSource(`${DEPRECATED_getCurrentPlatform()!.url}${this.props.userinfo.photo}`);
  // FIXME (Hack): we need to add a variable param to force the call on Android for each session
  // (otherwise, a previously-loaded image is retrieved from cache)

  sourceWithParam = this.URISource && {
    ...this.URISource,
    uri: `${
      this.URISource && this.URISource.uri
    }?uti=${OAuth2RessourceOwnerPasswordClient.connection?.getUniqueSessionIdentifier()}`,
  };

  // SVG size management
  headerWidth = UI_SIZES.screen.width;

  headerHeight = Math.ceil(this.headerWidth * (545 / 375));

  headerTop = Math.ceil(54 * (this.headerWidth / 375)) - this.headerHeight;

  public onDiconnect = () => {
    Alert.alert('', I18n.t('auth-disconnectConfirm'), [
      {
        text: I18n.t('common.cancel'),
        style: 'default',
      },
      {
        text: I18n.t('directory-disconnectButton'),
        style: 'destructive',
        onPress: () => this.props.onLogout(),
      },
    ]);
  };

  public async onChangeAvatar(image: ImagePicked) {
    const { onUploadAvatar, onUpdateAvatar, onPickFileError, onUploadAvatarError } = this.props;
    try {
      const lc = new LocalFile(
        {
          filename: image.fileName as string,
          filepath: image.uri as string,
          filetype: image.type as string,
        },
        { _needIOSReleaseSecureAccess: false },
      );
      this.setState({ updatingAvatar: true });
      const sc = await onUploadAvatar(lc);
      await onUpdateAvatar(sc.url);
    } catch (err: any) {
      if (err.message === 'Error picking image') {
        onPickFileError('profileOne');
      } else if (!(err instanceof Error)) {
        onUploadAvatarError();
      }
    } finally {
      this.setState({ updatingAvatar: false });
    }
  }

  public render() {
    const { userinfo, session } = this.props;
    const { showVersionType, versionOverride, versionType } = this.state;

    return (
      <PageView
        style={styles.page}
        navigation={this.props.navigation}
        navBar={{
          title: I18n.t('MyAccount'),
        }}>
        <ScrollView style={styles.main} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <Notifier id="profileOne" />
          <View style={styles.userInfo}>
            <NamedSVG
              width={this.headerWidth}
              height={this.headerHeight}
              style={[styles.svgHeader, { top: this.headerTop }]}
              fill={theme.palette.primary.regular}
              name="userpage-header"
            />
            {userinfo.photo === '' ? (
              <ImagePicker callback={image => this.onChangeAvatar(image)} activeOpacity={1} cameraOptions={{ cameraType: 'front' }}>
                <Avatar sourceOrId={this.sourceWithParam} size={Size.verylarge} id="" />
              </ImagePicker>
            ) : (
              <Avatar sourceOrId={this.sourceWithParam} size={Size.verylarge} id="" />
            )}
            <BodyBoldText style={styles.userInfo_name}>{userinfo.displayName}</BodyBoldText>
            <SmallText style={styles.userInfo_type}>{I18n.t(`profileTypes.${session.user.type}`)}</SmallText>
            <ActionButton
              text={I18n.t('user.page.userFileButton')}
              type="secondary"
              action={() => {
                this.props.navigation.navigate('MyProfile');
              }}
              style={styles.userInfo_button}
            />
          </View>
          <View style={styles.section}>
            <HeadingSText style={styles.titleSection}>{I18n.t('user.page.configuration')}</HeadingSText>
            <ButtonLine title="directory-notificationsTitle" onPress={() => this.props.navigation.navigate('NotifPrefs')} first />
            <ButtonLine title="PasswordChange" onPress={() => this.props.navigation.navigate('ChangePassword')} />
            <ButtonLine
              title="user.sendEmailVerificationCodeScreen.titleModify"
              onPress={() => this.props.navigation.navigate('SendEmailVerificationCode', { isModifyingEmail: true })}
            />
            <ButtonLine title="directory-structuresTitle" onPress={() => this.props.navigation.navigate('Structures')} />
            {session.user.type === 'Student' ? (
              <ButtonLine title="directory-relativesTitle" onPress={() => this.props.navigation.navigate('Relatives')} />
            ) : session.user.type === 'Relative' ? (
              <ButtonLine title="directory-childrenTitle" onPress={() => this.props.navigation.navigate('Children')} />
            ) : null}
            <ButtonLine title="directory-xmasTitle" onPress={() => this.props.navigation.navigate('Xmas')} last />
          </View>
          <View style={[styles.section, styles.sectionLast]}>
            <HeadingSText style={styles.titleSection}>{I18n.t('user.page.others')}</HeadingSText>
            {this.showWhoAreWe ? (
              <>
                <ButtonLine title="directory-whoAreWeTitle" onPress={() => this.props.navigation.navigate('WhoAreWe')} first />
                <ButtonLine title="directory-legalNoticeTitle" onPress={() => this.props.navigation.navigate('LegalNotice')} last />
              </>
            ) : (
              <ButtonLine title="directory-legalNoticeTitle" onPress={() => this.props.navigation.navigate('LegalNotice')} alone />
            )}
          </View>
          <View style={styles.boxBottomPage}>
            <SmallBoldText style={styles.linkDisconnect} onPress={() => this.onDiconnect()}>
              {I18n.t('directory-disconnectButton')}
            </SmallBoldText>
            <SmallBoldText style={styles.textVersion} onLongPress={() => this.setState({ showVersionType: !showVersionType })}>
              {I18n.t('version-number')} {DeviceInfo.getVersion()}
              {showVersionType ? `-(${DeviceInfo.getBuildNumber()})-${versionType}-${versionOverride}` : ''}
            </SmallBoldText>
          </View>
        </ScrollView>
      </PageView>
    );
  }
}

const uploadAvatarAction = (avatar: LocalFile) => async (_dispatch: Dispatch, getState: () => IGlobalState) => {
  return workspaceService.uploadFile(getUserSession(), avatar, {});
};

const UserPageConnected = connect(
  (state: any) => {
    const ret = {
      userinfo: state.user.info,
      session: getUserSession(),
    };
    return ret;
  },
  (dispatch: ThunkDispatch<any, any, any>, getState: () => IGlobalState) => ({
    onLogout: () => dispatch<any>(logout()),
    onPickFileError: (notifierId: string) => dispatch(pickFileError(notifierId)),
    onUploadAvatarError: () => dispatch(uploadAvatarError()),
    onUploadAvatar: (avatar: LocalFile) => dispatch(uploadAvatarAction(avatar)),
    onUpdateAvatar: (imageWorkspaceUrl: string) =>
      dispatch(profileUpdateAction({ picture: imageWorkspaceUrl }, true)) as unknown as Promise<void>,
  }),
)(UserScreen);

export default withViewTracking('user')(UserPageConnected);
