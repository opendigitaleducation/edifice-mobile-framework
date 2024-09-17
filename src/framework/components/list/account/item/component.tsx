import * as React from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { SingleAvatar } from '~/framework/components/avatar';
import IconButton from '~/framework/components/buttons/icon';
import styles from '~/framework/components/list/account/item/styles';
import { AccountListItemProps } from '~/framework/components/list/account/item/types';
import { SmallBoldText, SmallText } from '~/framework/components/text';
import { i18nAccountTypes } from '~/framework/components/text/account-type';
import { AuthLoggedAccount, AuthSavedAccount } from '~/framework/modules/auth/model';

const AccountListItem = <ItemT extends AuthSavedAccount | AuthLoggedAccount>({
  selected,
  getAvatarSource,
  item,
  item: {
    user: { type, id, displayName, loginUsed },
  },
  index,
  separators,
  onPress,
  onDelete,
}: AccountListItemProps<ItemT>) => {
  const containerBackgroundColor = { backgroundColor: selected ? theme.palette.primary.pale : theme.ui.background.card };
  const typeColor = { color: theme.color.profileTypes[type] };
  const typeText = I18n.get(i18nAccountTypes[type]);
  const numberOfLines = 1;
  const onSelectAccount = async () => {
    onPress?.(item, index);
  };

  const onRemoveAccount = () => {
    Alert.alert(I18n.get('accountlistitem-removealert-title'), I18n.get('accountlistitem-removealert-description'), [
      {
        text: I18n.get('common-delete'),
        style: 'destructive',
        onPress: () => onDelete?.(item, index),
      },
      {
        text: I18n.get('common-cancel'),
      },
    ]);
  };

  const avatarProps = React.useMemo(
    () => (getAvatarSource ? { source: getAvatarSource({ item, index, separators }) } : { userId: id }),
    [getAvatarSource, id, index, item, separators],
  );

  return (
    <TouchableOpacity style={[styles.container, containerBackgroundColor]} onPress={onSelectAccount}>
      <View>
        <SingleAvatar size="lg" {...avatarProps} />
        <View style={styles.avatarContour} />
      </View>
      <View style={styles.textContainer}>
        <SmallText numberOfLines={numberOfLines}>{displayName}</SmallText>
        <SmallBoldText numberOfLines={numberOfLines} style={typeColor}>
          {typeText}
        </SmallBoldText>
      </View>
      <IconButton
        style={styles.iconButton}
        color={theme.palette.complementary.red.regular}
        icon="ui-delete"
        action={onRemoveAccount}
      />
    </TouchableOpacity>
  );
};

export default AccountListItem;
