import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture/Icon';
import { Small, SmallBold, TextSizeStyle } from '~/framework/components/text';

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_SIZES.spacing.small,
    backgroundColor: theme.palette.grey.white,
  },
  selectedItem: {
    backgroundColor: theme.palette.secondary.regular,
  },
  itemText: {
    ...TextSizeStyle.Medium,
    marginHorizontal: UI_SIZES.spacing.small,
  },
  itemTextSelected: {
    color: theme.palette.grey.white,
  },
});

type DrawerOptionProps = {
  label: string;
  count?: number;
  selected: boolean;
  iconName: string;
  navigate: () => any;
};

export default class DrawerOption extends React.PureComponent<DrawerOptionProps> {
  public render() {
    const { label, selected, iconName, count, navigate } = this.props;
    const touchableStyle = selected ? [styles.item, styles.selectedItem] : styles.item;
    const iconColor = selected ? theme.ui.text.inverse : '#000';
    const countString = count ? ` (${count})` : '';
    return (
      <TouchableOpacity style={touchableStyle} onPress={navigate} disabled={selected}>
        <Icon size={22} name={iconName} color={iconColor} />
        {selected ? (
          <SmallBold numberOfLines={1} style={[styles.itemTextSelected, styles.itemText]}>
            {label + countString}
          </SmallBold>
        ) : count ? (
          <SmallBold numberOfLines={1} style={styles.itemText}>
            {label + countString}
          </SmallBold>
        ) : (
          <Small numberOfLines={1} style={styles.itemText}>
            {label}
          </Small>
        )}
      </TouchableOpacity>
    );
  }
}
