import * as React from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { BottomColoredItem } from '~/framework/modules/viescolaire/dashboard/components/Item';

const styles = StyleSheet.create({
  gridButton: {
    alignItems: 'center',
    backgroundColor: theme.palette.grey.white,
    flexDirection: 'column',
  },
  gridButtonContainer: {
    elevation: 20,
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingVertical: UI_SIZES.spacing.minor,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    width: '50%',
  },
  gridButtonDisabled: {
    opacity: 0.6,
  },
  gridButtonEnabled: {
    opacity: 1,
  },
});

interface ModuleButtonProps {
  color: ColorValue;
  icon: string;
  text: string;
  disabled?: boolean;
  onPress: () => void;
}

export const ModuleButton = ({ color, disabled, icon, onPress, text }: ModuleButtonProps) => {
  return (
    <View style={styles.gridButtonContainer}>
      <BottomColoredItem
        shadow
        style={[styles.gridButton, disabled ? styles.gridButtonDisabled : styles.gridButtonEnabled]}
        color={color}
        onPress={onPress}
        disabled={disabled}>
        <Svg name={icon} height={70} width={70} fill={color} />
        <SmallText>{text}</SmallText>
      </BottomColoredItem>
    </View>
  );
};
