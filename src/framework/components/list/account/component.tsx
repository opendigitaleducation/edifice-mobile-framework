import * as React from 'react';
import { FlatList, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { DefaultButton } from '~/framework/components/buttons/default';
import AccountListItem from '~/framework/components/list/account/item';
import styles from '~/framework/components/list/account/styles';
import { AccountListProps } from '~/framework/components/list/account/types';
import BottomSheetModal from '~/framework/components/modals/bottom-sheet';
import { HeadingSText, SmallText } from '~/framework/components/text';

const ItemSeparator = () => <View style={styles.itemSeparator} />;

const AccountList = ({ data, description, title }: AccountListProps, ref) => {
  const hasSingleAccount = data.length === 1;
  const onAddAccount = () => null;
  const renderItem = ({ item }) => (
    <AccountListItem avatar={item.avatar} id={item.id} name={item.name} type={item.type} selected={item.selected} />
  );

  return (
    <BottomSheetModal ref={ref}>
      <View style={styles.textContainer}>
        <HeadingSText>{title}</HeadingSText>
        <SmallText>{description}</SmallText>
      </View>
      <FlatList scrollEnabled={false} data={data} renderItem={renderItem} ItemSeparatorComponent={ItemSeparator} />
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