import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, KeyboardTypeOptions, Platform, SafeAreaView, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';
import { AnyAction, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import theme from '~/app/theme';
import { ContainerTextInput, ContainerView } from '~/framework/components/buttons/line';
import { UI_SIZES } from '~/framework/components/constants';
import { ImagePicked } from '~/framework/components/menus/actions';
import { PageView } from '~/framework/components/page';
import { CaptionText, SmallText } from '~/framework/components/text';
import { assertSession, getSession } from '~/framework/modules/auth/reducer';
import { UserType } from '~/framework/modules/auth/service';
import { UpdatableProfileValues, profileUpdateAction } from '~/framework/modules/user/actions';
import UserCard from '~/framework/modules/user/components/user-card';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import workspaceService from '~/framework/modules/workspace/service';
import { NavBarAction, navBarOptions } from '~/framework/navigation/navBar';
import { LocalFile } from '~/framework/util/fileHandler';
import { formatSource } from '~/framework/util/media';
import { isEmpty } from '~/framework/util/object';
import { Trackers } from '~/framework/util/tracker';
import { pickFileError } from '~/infra/actions/pickFile';
import { notifierShowAction } from '~/infra/notifier/actions';
import Notifier from '~/infra/notifier/container';
import { PageContainer } from '~/ui/ContainerContent';
import { ValidatorBuilder } from '~/utils/form';

import styles from './styles';
import { IProfilePageProps, IProfilePageState } from './types';

export class ProfilePage extends React.PureComponent<IProfilePageProps, IProfilePageState> {
  defaultState: (force?: boolean) => IProfilePageState = force => ({
    displayName: this.props.session?.user.displayName,
    homePhone: this.props.session?.user.homePhone,
    homePhoneValid: true,
    loginAlias: this.props.session?.user.loginAlias,
    loginAliasValid: true,
    updatingAvatar: false,
  });

  state = this.defaultState();

  setState(newState: IProfilePageState) {
    super.setState(newState);
    setTimeout(() => {
      this.props.navigation.setParams({
        updatedProfileValues: { ...this.state },
      });
    });
  }

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

  public async onDeleteAvatar() {
    const { onUpdateAvatar, onUploadAvatarError } = this.props;
    try {
      this.setState({ updatingAvatar: true });
      await onUpdateAvatar('');
    } catch {
      onUploadAvatarError();
    } finally {
      this.setState({ updatingAvatar: false });
    }
  }

  public render() {
    const { session } = this.props;
    const isEditMode = this.props.route.params.edit ?? false;
    return (
      <PageContainer>
        <Notifier id="profileOne" />
        <Notifier id="profileTwo" />
        <KeyboardAvoidingView
          style={styles.profilePage}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 100, android: undefined })}>
          <ScrollView alwaysBounceVertical={false} overScrollMode="never">
            <SafeAreaView>
              <UserCard
                id={session?.user.photo && formatSource(`${session?.platform.url}${session?.user.photo}`)}
                displayName={session?.user.displayName!}
                type={
                  session?.user.type! as
                    | 'Student'
                    | 'Relative'
                    | 'Teacher'
                    | 'Personnel'
                    | ('Student' | 'Relative' | 'Teacher' | 'Personnel')[]
                }
                canEdit
                hasAvatar={!!session?.user.photo}
                updatingAvatar={this.state.updatingAvatar}
                onChangeAvatar={this.onChangeAvatar.bind(this)}
                onDeleteAvatar={this.onDeleteAvatar.bind(this)}
              />
              {this.renderItem({
                title: I18n.t('Login'),
                getter: () => (isEditMode ? this.state.loginAlias : this.state.loginAlias || session?.user.login),
                editable: true,
                setter: loginAlias => this.setState({ loginAlias }),
                validator: { key: 'loginAliasValid', regex: /^[0-9a-z\-.]+$/ },
                placeholder: session?.user.login,
              })}
              {this.renderItem({
                title: I18n.t('Firstname'),
                getter: () => session?.user.firstName,
              })}
              {this.renderItem({
                title: I18n.t('Lastname'),
                getter: () => session?.user.lastName,
              })}
              {this.renderItem({
                title: I18n.t('DisplayName'),
                getter: () => this.state.displayName,
                editable: session?.user.type !== 'Relative',
                setter: displayName => this.setState({ displayName }),
              })}
              {this.renderItem({
                title: I18n.t('EmailAddress'),
                getter: () => session?.user.email,
              })}
              {this.renderItem({
                title: I18n.t('Phone'),
                getter: () => this.state.homePhone,
                editable: true,
                setter: homePhone => this.setState({ homePhone }),
                keyboardType: 'phone-pad',
                validator: { key: 'homePhoneValid', regex: ValidatorBuilder.PHONE_REGEX },
              })}
              {this.renderItem({
                title: I18n.t('CellPhone'),
                getter: () => session?.user.mobile,
              })}
              {this.renderItem({
                title: I18n.t('Birthdate'),
                getter: () =>
                  session?.user.birthDate!.format('L') === 'Invalid date'
                    ? I18n.t('common-InvalidDate')
                    : session?.user.birthDate!.format('L'),
              })}
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </PageContainer>
    );
  }

  private renderItem({
    title,
    getter,
    editable = false,
    setter,
    keyboardType,
    validator,
    placeholder,
    placeholderTextColor,
  }: {
    title: string;
    getter: () => string | undefined;
    editable?: boolean;
    setter?: (val: any) => void;
    keyboardType?: KeyboardTypeOptions;
    validator?: { key: keyof IProfilePageState; regex: RegExp };
    placeholder?: string;
    placeholderTextColor?: string;
  }) {
    const isEditMode = this.props.route.params.edit ?? false;
    const label = (
      <CaptionText style={{ paddingHorizontal: UI_SIZES.spacing.medium, marginTop: UI_SIZES.spacing.medium }}>{title}</CaptionText>
    );
    let box: JSX.Element | null = null;

    if (isEditMode) {
      box = editable ? (
        <ContainerTextInput
          style={{
            paddingVertical: UI_SIZES.spacing.small,
          }}
          onChangeText={text => {
            if (validator) {
              if (validator.key === 'homePhoneValid') {
                if (text === '') this.setState({ [validator.key]: true });
                else this.setState({ [validator.key]: validator.regex.test(text) });
              } else {
                this.setState({ [validator.key]: validator.regex.test(text) });
              }
            }
            setter!(text);
          }}
          {...(keyboardType ? { keyboardType } : {})}
          {...(placeholder ? { placeholder } : {})}
          {...(placeholderTextColor ? { placeholderTextColor } : {})}>
          <SmallText
            style={[
              {
                color: validator
                  ? this.state[validator.key]
                    ? theme.ui.text.regular
                    : theme.palette.status.failure.regular
                  : theme.ui.text.regular,
              },
              styles.textOnEdit,
            ]}>
            {getter()}
          </SmallText>
        </ContainerTextInput>
      ) : (
        <ContainerView style={styles.containerItem}>
          <SmallText numberOfLines={1} style={styles.textItem}>
            {getter()}
          </SmallText>
        </ContainerView>
      );
    } else {
      box = (
        <ContainerView style={styles.containerItem}>
          <SmallText numberOfLines={1} style={styles.textItem}>
            {getter()}
          </SmallText>
        </ContainerView>
      );
    }

    return (
      <View {...(isEditMode && !editable ? { style: { opacity: 0.33 } } : {})}>
        {label}
        {box}
      </View>
    );
  }
}

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.notifPrefs>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
  }),
  title: I18n.t('MyProfile'),
});

export class UserProfileScreen extends React.PureComponent<IProfilePageProps, IProfilePageState> {
  constructor(props: IProfilePageProps) {
    super(props);
    this.props.navigation.setParams({
      onSave: this.props.onSave,
    });
  }

  canEdit = this.props.session?.user.type !== UserType.Student;

  componentDidUpdate() {
    const { navigation, route } = this.props;
    const isEditMode = route.params.edit ?? false;
    if (isEditMode) {
      navigation.setOptions({
        // eslint-disable-next-line react/no-unstable-nested-components
        headerLeft: () => (
          <NavBarAction
            title={I18n.t('Cancel')}
            onPress={() => {
              navigation.setParams({ edit: false });
              navigation.setParams({ updatedProfileValues: undefined });
              if (route.params.onCancel) route.params.onCancel();
            }}
          />
        ),
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => (
          <NavBarAction
            title={I18n.t('Save')}
            onPress={() => {
              const values = route.params.updatedProfileValues as IProfilePageState;
              if (!isEmpty(values)) {
                if (values.loginAliasValid && values.homePhoneValid) {
                  navigation.setParams({ edit: false });
                  if (route.params.onSave && route.params.updatedProfileValues) {
                    route.params.onSave(route.params.updatedProfileValues);
                  }
                } else {
                  Alert.alert(I18n.t('common-ErrorUnknown2'), I18n.t('ProfileInvalidInformation'));
                }
              } else {
                navigation.setParams({ edit: false });
              }
            }}
          />
        ),
      });
      return;
    }
    if (this.canEdit) {
      navigation.setOptions({
        headerLeft: navBarOptions(this.props).headerLeft,
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => <NavBarAction onPress={() => navigation.setParams({ edit: true })} iconName="ui-edit" />,
      });
    }
  }

  render() {
    return (
      <PageView>
        <ProfilePage {...this.props} />
      </PageView>
    );
  }
}

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

const uploadAvatarAction = (avatar: LocalFile) => async (_dispatch: ThunkDispatch<any, any, any>) => {
  try {
    return await workspaceService.file.uploadFile(assertSession(), avatar, {});
  } catch {
    _dispatch(uploadAvatarError());
  }
};

const UserProfileScreenConnected = connect(
  (state: any) => {
    const ret = {
      session: getSession(),
    };
    return ret;
  },
  (dispatch: ThunkDispatch<any, void, AnyAction>) => ({
    onSave(updatedProfileValues: UpdatableProfileValues) {
      // Code smell 💩 : ne return here. Exception will be unhandled but no crash.
      dispatch(profileUpdateAction(updatedProfileValues));
    },
    onPickFileError: (notifierId: string) => dispatch(pickFileError(notifierId)),
    onUploadAvatarError: () => dispatch(uploadAvatarError()),
    onUploadAvatar: (avatar: LocalFile) => dispatch(uploadAvatarAction(avatar)),
    onUpdateAvatar: (imageWorkspaceUrl: string) =>
      dispatch(profileUpdateAction({ photo: imageWorkspaceUrl })) as unknown as Promise<void>,
  }),
)(UserProfileScreen);

export default UserProfileScreenConnected;