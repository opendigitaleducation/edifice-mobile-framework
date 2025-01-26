import * as React from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import styled from '@emotion/native';

import theme from '~/app/theme';
import { Icon } from '~/framework/components/picture';
import { SmallBoldText } from '~/framework/components/text';

const styles = StyleSheet.create({
  buttonWithShadow: {
    elevation: 5,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.8,
  },
  mainContainer: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
});

const TouchableOpacity = styled.TouchableOpacity({
  alignItems: 'center',
  backgroundColor: theme.palette.secondary.regular,
  borderRadius: 25,
  height: 50,
  justifyContent: 'center',
  width: 50,
});

interface IButtonTextIconProps {
  name: string;
  size?: number;
  style?: any;
  children?: any;
  color?: string | ColorValue;
  colorText?: string;
  onPress: () => any;
}

export const ButtonIcon = ({ color = theme.ui.text.inverse, name, onPress, size, style }: IButtonTextIconProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.buttonWithShadow, style]}>
    <Icon color={color} size={size ?? 24} name={name} />
  </TouchableOpacity>
);

export const ButtonIconText = ({ children, colorText = theme.ui.text.regular as string, style, ...rest }: IButtonTextIconProps) => (
  <View style={styles.mainContainer}>
    <ButtonIcon {...rest} style={[styles.buttonWithShadow, style]} />
    <SmallBoldText style={{ color: colorText }}>{children}</SmallBoldText>
  </View>
);

export function getMenuShadow() {
  return {
    elevation: 5,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.8,
  };
}
