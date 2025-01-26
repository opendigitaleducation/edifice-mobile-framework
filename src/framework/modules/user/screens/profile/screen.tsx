import * as React from 'react';
import { Linking, Platform, TouchableOpacity, View } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomSheet from 'react-native-bottomsheet';
import { connect } from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import styles from './styles';
import { ProfilePageProps } from './types';

import { hobbiesItems, renderEmoji } from '.';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { ButtonLineGroup, LineButton } from '~/framework/components/buttons/line';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { ImagePicked, MenuAction } from '~/framework/components/menus/actions';
import { Svg } from '~/framework/components/picture';
import ScrollView from '~/framework/components/scrollView';
import { BodyText, HeadingSText, SmallItalicText, SmallText } from '~/framework/components/text';
import { TextAvatar } from '~/framework/components/textAvatar';
import Toast from '~/framework/components/toast';
import { ContentLoader } from '~/framework/hooks/loader';
import { AccountType } from '~/framework/modules/auth/model';
import { assertSession, getSession } from '~/framework/modules/auth/reducer';
import { conversationRouteNames } from '~/framework/modules/conversation/navigation';
import { profileUpdateAction } from '~/framework/modules/user/actions';
import UserPlaceholderProfile from '~/framework/modules/user/components/placeholder/profile';
import UserCard from '~/framework/modules/user/components/user-card';
import { InfoPerson } from '~/framework/modules/user/model';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { getShowMottoMoodRight } from '~/framework/modules/user/rights';
import { renderMoodPicture } from '~/framework/modules/user/screens/profile/edit-moodmotto';
import { userService } from '~/framework/modules/user/service';
import workspaceService from '~/framework/modules/workspace/service';
import { navBarOptions, navBarTitle } from '~/framework/navigation/navBar';
import appConf from '~/framework/util/appConf';
import { LocalFile } from '~/framework/util/fileHandler';
import { formatSource, Image } from '~/framework/util/media';
import { isEmpty } from '~/framework/util/object';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.profile>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-profile-appname'),
  }),
});

const renderTextIcon = ({
  icon,
  onPress,
  show,
  showArrow,
  text,
  textEmpty,
}: {
  icon: string;
  text: string | undefined;
  textEmpty?: string;
  onPress?: () => any;
  show?: boolean;
  showArrow?: boolean;
}) => {
  if (isEmpty(text) && !show) return;
  const emptyText = textEmpty ?? I18n.get('user-profile-notSpecified');
  return (
    <LineButton
      title={isEmpty(text) ? emptyText : text!}
      icon={icon}
      {...(onPress && !isEmpty(text) ? { onPress } : null)}
      {...(isEmpty(text) ? { textStyle: styles.textEmpty } : null)}
      showArrow={showArrow}
    />
  );
};

const showBottomMenu = (actions: MenuAction[]) => {
  actions.push({ action: () => {}, title: I18n.get('common-cancel') });
  BottomSheet.showBottomSheetWithOptions(
    {
      cancelButtonIndex: actions.length - 1,
      options: [
        ...actions.map(action => {
          return action.title;
        }),
      ],
    },
    index => {
      actions[index].action();
    },
  );
};

const callPhoneNumber = tel => {
  const telWithoutSpaces = tel.replace(/\s/g, '');
  Linking.canOpenURL(`tel:${telWithoutSpaces}`)
    .then(supported => {
      if (supported) return Linking.openURL(`tel:${telWithoutSpaces}`);
      console.debug(`L'appel du numéro ${telWithoutSpaces} n'est pas supporté.`);
    })
    .catch(err => {
      console.error("Une erreur s'est produite lors de l'appel du numéro.", err);
    });
};

const UserProfileScreen = (props: ProfilePageProps) => {
  const { navigation, onUpdateAvatar, onUploadAvatar, onUploadAvatarError, route, session } = props;

  const [updatingAvatar, setUpdatingAvatar] = React.useState<boolean>(false);
  const [userInfo, setUserInfo] = React.useState<undefined | InfoPerson>(undefined);
  const [family, setFamily] = React.useState<undefined | { relatedId: string | null; relatedName: string | null }[]>(undefined);
  const isMyProfile = React.useMemo(() => !(route.params.userId && route.params.userId !== session?.user.id), [route, session]);

  const descriptionVisibility = route.params.newDescriptionVisibility ?? userInfo?.visibleInfos.includes('SHOW_HEALTH');
  const description = route.params.newDescription ?? userInfo?.health;
  const mood = route.params.newMood ?? userInfo?.mood;
  const motto = route.params.newMotto ?? userInfo?.motto;
  const hobbies = route.params.newHobbies ?? userInfo?.hobbies;

  const onChangeAvatar = async (image: ImagePicked) => {
    try {
      const lc = new LocalFile(
        {
          filename: image.fileName as string,
          filepath: image.uri as string,
          filetype: image.type as string,
        },
        { _needIOSReleaseSecureAccess: false },
      );
      setUpdatingAvatar(true);
      const sc = await onUploadAvatar(lc);
      await onUpdateAvatar(sc.url);
    } catch (err: any) {
      if (err.message === 'Error picking image') {
        Toast.showError(I18n.get('pickfile-error-storageaccess'));
      } else if (!(err instanceof Error)) {
        onUploadAvatarError();
      }
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const onDeleteAvatar = async () => {
    try {
      setUpdatingAvatar(true);
      await onUpdateAvatar('');
    } catch {
      onUploadAvatarError();
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const init = async () => {
    const data = isMyProfile ? await userService.person.get() : await userService.person.get(route.params.userId);

    if (!isEmpty(data[0].relatedId)) {
      const filteredDataFamily = data.map(({ relatedId, relatedName }) => ({ relatedId, relatedName }));
      setFamily(filteredDataFamily);
    }

    setUserInfo(data[0]);
  };

  const onNewMessage = () => {
    const user = [{ displayName: userInfo?.displayName, id: userInfo?.id }];
    if (userInfo?.type === AccountType.Student && !isEmpty(family) && session?.user.type !== AccountType.Student) {
      const familyUser: any = [];
      family?.forEach(item => familyUser.push({ displayName: item.relatedName, id: item.relatedId }));
      showBottomMenu([
        {
          action: () =>
            navigation.navigate(conversationRouteNames.newMail, {
              toUsers: user,
            }),
          title: I18n.get('user-profile-sendMessage-student'),
        },
        {
          action: () =>
            navigation.navigate(conversationRouteNames.newMail, {
              toUsers: familyUser,
            }),
          title: I18n.get('user-profile-sendMessage-relatives'),
        },
        {
          action: () =>
            navigation.navigate(conversationRouteNames.newMail, {
              toUsers: user.concat(familyUser),
            }),
          title: I18n.get('user-profile-sendMessage-relatives&student'),
        },
      ]);
      return;
    }
    return navigation.navigate(conversationRouteNames.newMail, {
      toUsers: user,
    });
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: navBarTitle(isMyProfile ? I18n.get('user-profile-appname') : I18n.get('user-profile-appname-externe')),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderUserCard = () => {
    const selfAvatar = isMyProfile ? session?.user.avatar : undefined;
    const userAvatar = userInfo?.id;
    return (
      <UserCard
        id={selfAvatar ? formatSource(`${session?.platform.url}${selfAvatar}`) : (userAvatar ?? '')}
        displayName={userInfo?.displayName}
        type={userInfo?.type}
        hasAvatar={!!session?.user.avatar}
        updatingAvatar={updatingAvatar}
        onChangeAvatar={onChangeAvatar.bind(this)}
        onDeleteAvatar={onDeleteAvatar.bind(this)}
        canEdit={isMyProfile}
        onPressInlineButton={() => onNewMessage()}
      />
    );
  };

  const renderPersonFamily = user => {
    if (
      (!isMyProfile && (session?.user.type === AccountType.Teacher || session?.user.type === AccountType.Personnel)) ||
      (isMyProfile && session?.user.type === AccountType.Relative)
    )
      return (
        <TouchableOpacity
          key={user.relatedId}
          style={styles.userFamily}
          onPress={() => navigation.push(userRouteNames.profile, { userId: user.relatedId! })}>
          <TextAvatar userId={user.relatedId!} text={user.relatedName!} isHorizontal />
          <Svg
            style={styles.userFamilyIcon}
            name="ui-rafterRight"
            width={UI_SIZES.dimensions.width.mediumPlus}
            height={UI_SIZES.dimensions.height.mediumPlus}
            fill={theme.palette.primary.regular}
          />
        </TouchableOpacity>
      );
    return (
      <View key={user.relatedId} style={styles.userFamily}>
        <TextAvatar userId={user.relatedId!} text={user.relatedName!} isHorizontal />
      </View>
    );
  };

  const renderFamily = () => {
    if (userInfo?.type !== AccountType.Relative && userInfo?.type !== AccountType.Student) return;
    if (!isMyProfile && session?.user.type === AccountType.Student && userInfo?.type === AccountType.Relative) return;
    if (!isMyProfile && session?.user.type === AccountType.Student && userInfo?.type === AccountType.Student) return;
    return (
      <View style={styles.bloc}>
        <HeadingSText style={family ? {} : styles.blocTitle}>
          {userInfo?.type === AccountType.Student
            ? I18n.get(family?.length! > 1 ? 'user-profile-relatives' : 'user-profile-relative')
            : I18n.get(family?.length! > 1 ? 'user-profile-children' : 'user-profile-child')}
        </HeadingSText>
        {!isEmpty(family) ? (
          family?.map(user => renderPersonFamily(user))
        ) : (
          <View style={styles.emptyFamily}>
            <Svg
              name="ui-question"
              width={UI_SIZES.dimensions.width.largePlus}
              height={UI_SIZES.dimensions.width.largePlus}
              fill={theme.palette.grey.graphite}
              style={styles.emptyFamilyIcon}
            />
            <BodyText style={styles.textEmpty}>{I18n.get('user-profile-notSpecified')}</BodyText>
          </View>
        )}
      </View>
    );
  };

  const renderStructures = () => {
    const schools: string[] = [];
    let classes: any[] = [];
    userInfo?.schools.forEach(school => {
      schools.push(school.name);
      classes = classes.concat(school.classes);
    });
    return (
      <View style={styles.bloc}>
        <HeadingSText style={styles.blocTitle}>
          {I18n.get(schools.length > 1 ? 'user-profile-structures' : 'user-profile-structure')}
        </HeadingSText>
        <ButtonLineGroup>
          {renderTextIcon({
            icon: 'ui-school',
            onPress:
              schools.length > 1
                ? () => navigation.navigate(userRouteNames.structures, { structures: userInfo?.schools })
                : undefined,
            showArrow: true,
            text: `${
              schools[0] +
              (schools.length > 1
                ? ' + ' +
                  (schools.length - 1) +
                  ' ' +
                  I18n.get(schools.length > 2 ? 'user-profile-structures' : 'user-profile-structure').toLowerCase()
                : '')
            }`,
          })}
          {renderTextIcon({
            icon: 'ui-class',
            onPress:
              classes.length > 1
                ? () => navigation.navigate(userRouteNames.structures, { structures: userInfo?.schools })
                : undefined,
            show: true,
            showArrow: true,
            text: !isEmpty(classes)
              ? `${
                  classes[0] +
                  (classes.length > 1
                    ? ' + ' +
                      (classes.length - 1) +
                      ' ' +
                      I18n.get(classes.length > 2 ? 'user-profile-classes' : 'user-profile-class')
                    : '')
                }`
              : '',
            textEmpty: I18n.get('user-profile-classEmpty'),
          })}
        </ButtonLineGroup>
      </View>
    );
  };

  const renderPersonnalInfos = () => {
    if (
      isEmpty(userInfo?.birthdate) &&
      isEmpty(userInfo?.email) &&
      isEmpty(userInfo?.tel) &&
      isEmpty(userInfo?.mobile) &&
      !isMyProfile
    )
      return;
    return (
      <View style={styles.bloc}>
        <HeadingSText style={styles.blocTitle}>{I18n.get('user-profile-personnalInfos')}</HeadingSText>
        <ButtonLineGroup>
          {renderTextIcon({
            icon: 'ui-anniversary',
            show: isMyProfile,
            text: userInfo?.birthdate ? userInfo?.birthdate.format('D MMMM Y') : undefined,
          })}
          {renderTextIcon({
            icon: 'ui-mail',
            onPress: () =>
              showBottomMenu([{ action: () => Clipboard.setString(userInfo?.email!), title: I18n.get('user-profile-copyEmail') }]),
            show: isMyProfile,
            showArrow: false,
            text: userInfo?.email,
          })}
          {renderTextIcon({
            icon: 'ui-phone',
            onPress: () =>
              Platform.OS === 'ios'
                ? callPhoneNumber(userInfo?.tel)
                : showBottomMenu([
                    { action: () => callPhoneNumber(userInfo?.tel), title: I18n.get('user-profile-call') + ' ' + userInfo?.tel },
                  ]),
            show: isMyProfile,
            showArrow: false,
            text: userInfo?.tel ?? undefined,
          })}
          {renderTextIcon({
            icon: 'ui-smartphone',
            onPress: () =>
              Platform.OS === 'ios'
                ? callPhoneNumber(userInfo?.mobile)
                : showBottomMenu([
                    {
                      action: () => callPhoneNumber(userInfo?.mobile),
                      title: I18n.get('user-profile-call') + ' ' + userInfo?.mobile,
                    },
                  ]),
            show: isMyProfile,
            showArrow: false,
            text: userInfo?.mobile,
          })}
        </ButtonLineGroup>
      </View>
    );
  };

  const renderAbout = () => {
    if (!isMyProfile && isEmpty(userInfo?.health)) return;
    return (
      <View style={styles.bloc}>
        <View style={styles.blocTitle}>
          <HeadingSText>{I18n.get('user-profile-about')}</HeadingSText>
          {isMyProfile ? (
            <TertiaryButton
              text={I18n.get('common-edit')}
              action={() =>
                navigation.navigate(userRouteNames.editDescription, {
                  description,
                  hobbies,
                  mood,
                  motto,
                  userId: userInfo!.id,
                  visibility: descriptionVisibility,
                })
              }
            />
          ) : null}
        </View>
        {description ? (
          <SmallText>{description}</SmallText>
        ) : (
          <SmallText style={styles.textEmpty}>{I18n.get('user-profile-about-empty')}</SmallText>
        )}
      </View>
    );
  };

  const renderMoodMotto = () => {
    if (isMyProfile && !getShowMottoMoodRight(props.session!)) return;
    if ((isEmpty(userInfo?.mood) || userInfo?.mood === 'default') && isEmpty(userInfo?.motto) && !isMyProfile) return;
    const degre = appConf.is1d ? '1d' : '2d';
    return (
      <View style={styles.bloc}>
        <View style={styles.blocTitle}>
          <HeadingSText>{I18n.get('user-profile-mood-motto')}</HeadingSText>
          {isMyProfile ? (
            <TertiaryButton
              text={I18n.get('common-edit')}
              action={() =>
                navigation.navigate(userRouteNames.editMoodMotto, {
                  description,
                  hobbies,
                  mood,
                  motto,
                  userId: userInfo!.id,
                  visibility: descriptionVisibility,
                })
              }
            />
          ) : null}
        </View>
        <View style={styles.moodMotto}>
          <View style={styles.mood}>
            <Image source={renderMoodPicture[degre][mood ?? 'none']} style={styles.moodPicture} />
            <SmallText style={isEmpty(mood) || mood === 'default' ? styles.textEmpty : {}}>
              {I18n.get(`user-profile-mood-${mood ?? 'none'}-${degre}`)}
            </SmallText>
          </View>
          {isEmpty(motto) ? (
            <SmallItalicText style={[styles.motto, styles.textEmpty]}>
              {I18n.get(isMyProfile ? 'user-profile-mottoEmpty' : 'user-profile-notSpecified')}
            </SmallItalicText>
          ) : (
            <SmallItalicText style={styles.motto}>{`"${motto}"`}</SmallItalicText>
          )}
        </View>
      </View>
    );
  };

  const renderHobbies = () => {
    let emptyHobbie = '';
    hobbiesItems.forEach(hobbie => {
      const index = hobbies?.findIndex(hobbieItem => hobbieItem.category === hobbie);
      if (index === -1 || (index! >= 0 && hobbies![index!].values === '')) emptyHobbie += `${renderEmoji[hobbie]} `;
    });
    return (
      <View style={styles.bloc}>
        <View style={styles.blocTitle}>
          <HeadingSText>{I18n.get('user-profile-hobbies')}</HeadingSText>
          {isMyProfile ? (
            <TertiaryButton
              text={I18n.get('common-edit')}
              action={() =>
                navigation.navigate(userRouteNames.editHobbies, {
                  description,
                  hobbies,
                  mood,
                  motto,
                  userId: userInfo!.id,
                  visibility: descriptionVisibility,
                })
              }
            />
          ) : null}
        </View>

        <View style={styles.hobbies}>
          {hobbies!.map(hobbie =>
            hobbie.values ? (
              <View style={styles.hobbie} key={hobbie.category}>
                <SmallText>{`${renderEmoji[hobbie.category]} `}</SmallText>
                <SmallText style={styles.hobbieValue}>{`${hobbie.values}`}</SmallText>
              </View>
            ) : null,
          )}
          {!isEmpty(emptyHobbie) ? (
            <View style={styles.hobbie}>
              <SmallText style={styles.textEmpty}>
                {`${
                  emptyHobbie +
                  I18n.get(emptyHobbie.length > 3 ? 'user-profile-notSpecified-multiple' : 'user-profile-notSpecified') // check length > 2 bc are emoji (2) + 1 space
                }`}
              </SmallText>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPage = () => {
    return (
      <ScrollView style={styles.page}>
        {renderUserCard()}
        {appConf.is1d ? renderMoodMotto() : null}
        {renderFamily()}
        {renderStructures()}
        {renderPersonnalInfos()}
        {renderAbout()}
        {appConf.is2d ? renderMoodMotto() : null}
        {renderHobbies()}
      </ScrollView>
    );
  };

  return (
    <ContentLoader
      loadContent={init}
      renderContent={renderPage}
      renderError={() => <EmptyConnectionScreen />}
      renderLoading={() => <UserPlaceholderProfile />}
    />
  );
};

const uploadAvatarError = () => {
  Toast.showError(I18n.get('user-profile-changeavatar-error-upload'));
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
    onUpdateAvatar: (imageWorkspaceUrl: string) =>
      dispatch(profileUpdateAction({ avatar: imageWorkspaceUrl })) as unknown as Promise<void>,
    onUploadAvatar: (avatar: LocalFile) => dispatch(uploadAvatarAction(avatar)),
    onUploadAvatarError: () => dispatch(uploadAvatarError()),
  }),
)(UserProfileScreen);

export default UserProfileScreenConnected;
