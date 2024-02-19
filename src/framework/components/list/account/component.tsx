import { NavigationProp, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { FlatList, FlatListProps, View } from 'react-native';
import { useSelector } from 'react-redux';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { DefaultButton } from '~/framework/components/buttons/default';
import AccountListItem from '~/framework/components/list/account/item';
import styles from '~/framework/components/list/account/styles';
import { AccountListProps } from '~/framework/components/list/account/types';
import BottomSheetModal from '~/framework/components/modals/bottom-sheet';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { getSession } from '~/framework/modules/auth/reducer';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { ArrayElement } from '~/utils/types';

const ItemSeparator = () => (
  <View style={styles.separatorContainer}>
    <View style={styles.separator} />
  </View>
);

const AccountList = ({ data, description, title }: AccountListProps, ref) => {
  const hasSingleAccount = data.length === 1;
  const navigation = useNavigation<NavigationProp<UserNavigationParams>>();
  const onAddAccount = () => navigation.navigate(userRouteNames.accountOnboarding, {});
  const currentAccount = useSelector(state => getSession());
  const renderItem: FlatListProps<ArrayElement<typeof data>>['renderItem'] = ({ item }) => (
    <AccountListItem
      id={item.user.id}
      displayName={item.user.displayName}
      type={item.user.type}
      selected={item.user.id === currentAccount?.user.id}
    />
  );

  return (
    <BottomSheetModal ref={ref}>
      <View style={styles.textContainer}>
        <HeadingSText>{title}</HeadingSText>
        <SmallText>{description}</SmallText>
      </View>
      <FlatList<ArrayElement<typeof data>>
        scrollEnabled={false}
        data={data}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
      />
      {hasSingleAccount ? (
        <DefaultButton
          iconLeft="ui-plus"
          text={I18n.get('accountlist-add')}
          contentColor={theme.palette.primary.regular}
          style={styles.addAccount}
          action={onAddAccount}
        />
      ) : null}
    </BottomSheetModal>
  );
};

export default React.forwardRef(AccountList);
