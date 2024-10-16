import * as React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES, getScaleWidth } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';

export interface CheckboxProps {
  onPress: () => void;
  checked: boolean;
  partialyChecked?: boolean;
  customContainerStyle?: ViewStyle;
}

const styles = StyleSheet.create({
  container: {
    margin: UI_SIZES.spacing._LEGACY_tiny,
    width: getScaleWidth(UI_SIZES.dimensions.width.mediumPlus),
    height: getScaleWidth(UI_SIZES.dimensions.height.mediumPlus),
    borderRadius: UI_SIZES.radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: getScaleWidth(UI_SIZES.border.small),
  },
});

export const Checkbox = ({ checked, partialyChecked, onPress, customContainerStyle }: CheckboxProps) => {
  const checkedContainerStyle = {
    backgroundColor: checked ? theme.palette.primary.regular : theme.ui.background.card,
    borderColor: checked || partialyChecked ? theme.palette.primary.regular : theme.palette.grey.graphite,
  };

  const renderStatus = () => {
    if (partialyChecked)
      return (
        <NamedSVG
          name="ui-checkbox-partial"
          width={UI_SIZES.elements.icon.xsmall}
          height={UI_SIZES.elements.icon.xsmall}
          fill={theme.palette.primary.regular}
        />
      );
    if (checked)
      return (
        <NamedSVG
          name="ui-checkbox-check"
          width={UI_SIZES.elements.icon.xsmall}
          height={UI_SIZES.elements.icon.xsmall}
          fill={theme.ui.text.inverse}
        />
      );
  };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, checkedContainerStyle, customContainerStyle]}>
      {renderStatus()}
    </TouchableOpacity>
  );
};
