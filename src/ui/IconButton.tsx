import * as React from 'react';
import { ColorValue, View, ViewStyle } from 'react-native';

import theme from '~/app/theme';
import { Icon } from '~/framework/components/picture';

export const IconButton = (props: {
  iconName: string;
  iconColor?: ColorValue;
  iconSize?: number;
  iconStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  disabled?: boolean;
}) => {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.palette.primary.regular,
          borderRadius: 15,
          height: 30,
          justifyContent: 'center',
          opacity: props.disabled ? 0.5 : 1,
          width: 30,
        },
        props.buttonStyle,
      ]}>
      <Icon
        name={props.iconName}
        color={props.iconColor || theme.ui.text.inverse}
        size={props.iconSize || 13}
        style={props.iconStyle}
      />
    </View>
  );
};
