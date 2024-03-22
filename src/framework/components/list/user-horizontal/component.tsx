import * as React from 'react';
import { ListRenderItemInfo, FlatList as RNFlatList, TouchableOpacity, View } from 'react-native';

import { SingleAvatar } from '~/framework/components/avatar';
import { Size } from '~/framework/components/avatar/types';
import HorizontalList, { HorizontalListProps } from '~/framework/components/list/horizontal';
import { SmallText } from '~/framework/components/text';
import { DisplayUserPublic } from '~/framework/modules/auth/model';

import styles from './styles';
import { UserListItemProps, UserListProps } from './types';

export const DISPLAY_NAME_NUMBER_OF_LINES = 2;

export const UserListItemDetails = <ItemT extends DisplayUserPublic = DisplayUserPublic>({ item }: UserListItemProps<ItemT>) => {
  return (
    <>
      <SmallText style={styles.itemText}>{item.displayName}</SmallText>
    </>
  );
};

// export const UserListItemDetailsWithType = <ItemT extends DisplayUserPublicWithType = DisplayUserPublicWithType>({
//   item,
// }: UserListItemProps<ItemT>) => {
//   const profileTextStyle = React.useMemo(() => [styles.itemText, getProfileColorStyle(item)], [item]);
//   return (
//     <>
//       <SmallText style={styles.itemText} numberOfLines={DISPLAY_NAME_NUMBER_OF_LINES}>
//         {item.displayName}
//       </SmallText>
//       <SmallBoldText style={profileTextStyle}>{item.type.toString()}</SmallBoldText>
//     </>
//   );
// };

const UserListItem = <ItemT extends DisplayUserPublic = DisplayUserPublic>(props: UserListItemProps<ItemT>) => {
  const { renderUserDetails, style, ...info } = props;
  return (
    <View style={style}>
      <SingleAvatar userId={info.item.id} size={Size.xxl} />
      {(renderUserDetails ?? UserListItemDetails)(info)}
    </View>
  );
};

export const UserList = React.forwardRef(
  <ItemT extends DisplayUserPublic = DisplayUserPublic>(
    props: UserListProps<ItemT>,
    ref: React.Ref<RNFlatList<ItemT>> | null | undefined,
  ) => {
    const {
      size,
      centered,
      onItemPress,
      renderUserDetails,
      itemContainerStyle,
      contentContainerStyle,
      userItemComponent,
      ...listProps
    } = props;

    const ItemTouchWrapper = onItemPress ? TouchableOpacity : React.Fragment;

    const realContentContainerStyle = React.useMemo(
      () => [styles.contentContainer, contentContainerStyle],
      [contentContainerStyle],
    );

    const realItemContainerStyle = React.useMemo(() => [styles.item, itemContainerStyle], [itemContainerStyle]);

    const keyExtractor = React.useCallback((item: ItemT) => item.id, []);
    const UserListItemComponent = userItemComponent ?? UserListItem;
    const renderItem: HorizontalListProps<ItemT>['renderItem'] = React.useCallback(
      (info: ListRenderItemInfo<ItemT>) => {
        return (
          <ItemTouchWrapper
            {...(onItemPress
              ? {
                  onPress: event => {
                    onItemPress?.(info.item, info.index, event);
                  },
                }
              : {})}>
            <UserListItemComponent {...info} renderUserDetails={renderUserDetails} style={realItemContainerStyle} />
          </ItemTouchWrapper>
        );
      },
      [ItemTouchWrapper, UserListItemComponent, onItemPress, realItemContainerStyle, renderUserDetails],
    );
    return (
      <HorizontalList
        keyExtractor={keyExtractor}
        ref={ref}
        alwaysBounceHorizontal={false}
        {...listProps}
        renderItem={renderItem}
        contentContainerStyle={realContentContainerStyle}
      />
    );
  },
);