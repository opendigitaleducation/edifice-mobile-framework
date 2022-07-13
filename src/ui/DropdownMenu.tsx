import * as React from 'react';
import { ColorValue, FlatList, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture/Icon';
import { Text } from '~/framework/components/text';

const style = StyleSheet.create({
  transparentContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingVertical: UI_SIZES.spacing.tiny,
    borderBottomLeftRadius: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.small,
  },
  itemIcon: {
    marginRight: UI_SIZES.spacing.minor,
    color: theme.palette.grey.white,
  },
  itemText: {
    fontSize: 15,
    color: theme.palette.grey.white,
  },
});

export type DropdownMenuAction = {
  icon: string;
  text: string;
  onPress: () => any;
};

interface IDropdrownMenuProps {
  data: DropdownMenuAction[];
  isVisible: boolean;
  color?: ColorValue;
  onTapOutside: () => any;
}

export const DropdownMenu = ({ data, isVisible, color, onTapOutside }: IDropdrownMenuProps) => {
  return isVisible ? (
    <TouchableWithoutFeedback onPress={onTapOutside}>
      <View style={style.transparentContainer}>
        <FlatList
          data={data}
          style={[style.menuContainer, { backgroundColor: color || theme.palette.primary.regular }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                item.onPress();
                onTapOutside();
              }}>
              <View style={style.itemContainer}>
                <Icon name={item.icon} size={24} style={style.itemIcon} />
                <Text style={style.itemText}>{item.text}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableWithoutFeedback>
  ) : null;
};
