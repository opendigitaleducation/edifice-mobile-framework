import * as React from 'react';
import { Pressable, View } from 'react-native';

import styles from './styles';
import type { RadioButtonProps } from './types';

import theme from '~/app/theme';
import { Svg } from '~/framework/components/picture';
import { BodyText, SmallText } from '~/framework/components/text';

export const RadioButton = ({ isChecked, isDisabled, label, onPress, size = 'default', style }: RadioButtonProps) => {
  const [isPressed, setPressed] = React.useState<boolean>(false);
  const LabelTextComponent = size === 'default' ? BodyText : SmallText;
  const iconSize = size === 'default' ? 24 : 22;

  const onPressIn = () => setPressed(true);

  const onPressOut = () => setPressed(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[styles.container, style]}>
      {label ? (
        <LabelTextComponent style={[styles.labelText, isDisabled && styles.disabledLabelText]}>{label}</LabelTextComponent>
      ) : null}
      <View style={[styles.iconContainer, isPressed && styles.iconPressedContainer]}>
        <Svg
          name={isChecked ? 'ui-radio-checked' : 'ui-radio-unchecked'}
          width={iconSize}
          height={iconSize}
          fill={
            isChecked
              ? isDisabled
                ? theme.palette.primary.light
                : theme.palette.primary.regular
              : isDisabled
                ? theme.palette.grey.grey
                : isPressed
                  ? theme.palette.primary.regular
                  : theme.palette.grey.graphite
          }
        />
      </View>
    </Pressable>
  );
};
