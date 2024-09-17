import * as React from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, getScaleFontSize } from '~/framework/components/constants';
import { Icon } from '~/framework/components/icon';
import { SmallBoldText, SmallText, TextFontStyle, TextSizeStyle } from '~/framework/components/text';
import { ConversationResultGroupItem, ConversationResultUserItem } from '~/framework/modules/conversation/components/result-item';
import { VisibleType } from '~/framework/modules/conversation/state/visibles';

//FIXME: create/move to styles.ts
const styles = StyleSheet.create({
  selectedListContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 0 },
  titleResultSearch: {
    color: theme.palette.grey.graphite,
    marginBottom: UI_SIZES.spacing.small,
  },
});

export const FoundList = ({ foundUserOrGroup, addUser, recipientType, isBookmarks }) => {
  const insets = useSafeAreaInsets();
  const absoluteListStyle = {
    backgroundColor: theme.ui.background.card,
    flex: 1,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  } as ViewStyle;

  const renderItemByType = item => {
    const disabled = item.usedIn ? !item.usedIn.includes(recipientType) : false;
    const ViewComponent = disabled ? View : TouchableOpacity;
    const Component = item.type === VisibleType.USER ? ConversationResultUserItem : ConversationResultGroupItem;
    return (
      <ViewComponent onPress={() => addUser(item)}>
        <Component item={item} disabled={disabled} />
      </ViewComponent>
    );
  };

  return (
    <FlatList
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      removeClippedSubviews
      nestedScrollEnabled
      contentContainerStyle={{
        paddingHorizontal: UI_SIZES.spacing.medium,
        paddingTop: UI_SIZES.spacing.small,
        paddingBottom: insets.bottom,
      }}
      style={absoluteListStyle}
      data={foundUserOrGroup}
      ListHeaderComponent={
        <SmallBoldText style={styles.titleResultSearch}>
          {isBookmarks
            ? I18n.get('conversation-newmail-bookmarks')
            : `${foundUserOrGroup.length} ${I18n.get(foundUserOrGroup.length > 1 ? 'conversation-newmail-communicationresults' : 'conversation-newmail-communicationresult')}`}
        </SmallBoldText>
      }
      renderItem={({ item }) => renderItemByType(item)}
    />
  );
};

export const Input = ({
  value,
  onChangeText,
  onSubmit,
  autoFocus,
  inputRef,
  key,
  onEndEditing = () => {},
  onFocus = () => {},
  onBlur = () => {},
}) => {
  const textInputStyle = {
    ...TextFontStyle.Regular,
    ...TextSizeStyle.Normal,
    lineHeight: undefined,
    flex: 0,
    paddingVertical: UI_SIZES.spacing.tiny,
    color: theme.ui.text.regular,
    marginVertical: 2, // Hack to compensate the position of TextInput baseline compared to regular text.
    height: getScaleFontSize(20) * 1.5, // Some magic here.
  } as ViewStyle;

  return (
    <TextInput
      key={key}
      ref={ref => {
        if (ref) {
          inputRef.current = ref;
        }
      }}
      autoFocus={autoFocus}
      autoCorrect={false}
      spellCheck={false}
      autoCapitalize="none"
      style={textInputStyle}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      onEndEditing={onEndEditing}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};

//Selected Item

const SelectedUserOrGroup = ({ onClick, displayName }) => {
  const itemStyle = {
    backgroundColor: theme.palette.complementary.blue.pale,
    borderRadius: 3,
    paddingVertical: UI_SIZES.spacing.tiny,
    paddingHorizontal: UI_SIZES.spacing.tiny,
    marginRight: UI_SIZES.spacing.tiny,
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle;

  const userLabel = { color: theme.palette.complementary.blue.regular, textAlignVertical: 'center' } as ViewStyle;

  return (
    <TouchableOpacity onPress={onClick} style={itemStyle}>
      <SmallText style={userLabel}>{displayName}</SmallText>
      <Icon
        name="close"
        size={12}
        color={theme.palette.complementary.blue.regular}
        style={{ marginLeft: UI_SIZES.spacing.minor }}
      />
    </TouchableOpacity>
  );
};
export const SelectedList = ({ selectedUsersOrGroups, onItemClick }) => {
  return selectedUsersOrGroups.length > 0 ? (
    <View style={styles.selectedListContainer}>
      {selectedUsersOrGroups.map(userOrGroup => (
        <SelectedUserOrGroup
          key={userOrGroup.id}
          onClick={() => onItemClick(userOrGroup.id)}
          displayName={userOrGroup.displayName}
        />
      ))}
    </View>
  ) : (
    <View />
  );
};
