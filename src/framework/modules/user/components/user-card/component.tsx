import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import TertiaryButton from '~/framework/components/buttons/tertiary';
import { cameraAction, galleryAction } from '~/framework/components/menus/actions';
import BottomMenu from '~/framework/components/menus/bottom';
import { HeadingXSText, SmallBoldText } from '~/framework/components/text';
import { i18nAccountTypes } from '~/framework/components/text/account-type';
import { IconButton } from '~/ui/IconButton';
import { Loading } from '~/ui/Loading';
import Avatar, { Size } from '~/ui/avatars/Avatar';

import styles from './styles';
import { IUserCardProps } from './types';

export const UserCard = ({
  id,
  displayName,
  type,
  canEdit = false,
  hasAvatar,
  updatingAvatar,
  onPressInlineButton,
  onChangeAvatar,
  onDeleteAvatar,
}: IUserCardProps) => {
  const renderActions = (avatar: boolean, changeAvatar: (image) => void, deleteAvatar: () => void) => (
    <View style={styles.buttonsActionAvatar}>
      {avatar ? (
        <>
          <BottomMenu
            title={I18n.get('user-usercard-bottommenu-changeavatar')}
            actions={[
              cameraAction({
                callback: image => (updatingAvatar ? undefined : changeAvatar(image)),
                useFrontCamera: true,
              }),
              galleryAction({ callback: image => (updatingAvatar ? undefined : changeAvatar(image)) }),
            ]}>
            <IconButton disabled={updatingAvatar} iconName="pencil" iconColor={theme.ui.text.inverse} iconSize={15} />
          </BottomMenu>
          <TouchableOpacity
            disallowInterruption
            onPress={() => (updatingAvatar ? null : deleteAvatar())}
            activeOpacity={updatingAvatar ? 1 : 0}>
            <IconButton disabled={updatingAvatar} iconName="trash" iconColor={theme.ui.text.inverse} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.viewNoAvatar} />
          <BottomMenu
            title={I18n.get('user-usercard-bottommenu-changeavatar')}
            actions={[
              cameraAction({
                callback: image => (updatingAvatar ? undefined : changeAvatar(image)),
                useFrontCamera: true,
              }),
              galleryAction({ callback: image => (updatingAvatar ? undefined : changeAvatar(image)) }),
            ]}>
            <IconButton disabled={updatingAvatar} iconName="camera-on" iconColor={theme.ui.text.inverse} iconSize={15} />
          </BottomMenu>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.main}>
      <View style={[styles.boxAvatar, { ...(canEdit ? styles.boxAvatarEdit : {}) }]}>
        <Avatar sourceOrId={id} size={Size.xxl} id="" />
        {canEdit ? renderActions(hasAvatar, onChangeAvatar, onDeleteAvatar) : null}
        {updatingAvatar ? <Loading customColor={theme.palette.grey.white} customStyle={styles.loaderAvatar} /> : null}
      </View>
      <View style={styles.boxTexts}>
        <HeadingXSText style={styles.name}>{displayName}</HeadingXSText>
        <SmallBoldText style={{ color: theme.color.profileTypes[type] }}>{I18n.get(i18nAccountTypes[type])}</SmallBoldText>
        {!canEdit ? (
          <TertiaryButton
            style={styles.sendMessage}
            iconLeft="ui-mail"
            text={I18n.get('user-profile-sendMessage')}
            action={onPressInlineButton}
          />
        ) : null}
      </View>
    </View>
  );
};
