import * as React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { getScaleWidth, UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';

export interface CheckboxProps {
  onPress: () => void;
  checked: boolean;
  partialyChecked?: boolean;
  customContainerStyle?: ViewStyle;
  testID?: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: UI_SIZES.radius.small,
    borderWidth: getScaleWidth(UI_SIZES.border.small),
    height: getScaleWidth(UI_SIZES.dimensions.height.mediumPlus),
    justifyContent: 'center',
    margin: UI_SIZES.spacing._LEGACY_tiny,
    width: getScaleWidth(UI_SIZES.dimensions.width.mediumPlus),
  },
});

export const Checkbox = ({ checked, customContainerStyle, onPress, partialyChecked, testID }: CheckboxProps) => {
  const checkedContainerStyle = {
    backgroundColor: checked ? theme.palette.primary.regular : theme.ui.background.card,
    borderColor: checked || partialyChecked ? theme.palette.primary.regular : theme.palette.grey.graphite,
  };

  const renderStatus = () => {
    if (partialyChecked)
      return (
        <Svg
          name="ui-checkbox-partial"
          width={UI_SIZES.elements.icon.xsmall}
          height={UI_SIZES.elements.icon.xsmall}
          fill={theme.palette.primary.regular}
        />
      );
    if (checked)
      return (
        <Svg
          name="ui-checkbox-check"
          width={UI_SIZES.elements.icon.xsmall}
          height={UI_SIZES.elements.icon.xsmall}
          fill={theme.ui.text.inverse}
        />
      );
  };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, checkedContainerStyle, customContainerStyle]} testID={testID}>
      {renderStatus()}
    </TouchableOpacity>
  );
};
