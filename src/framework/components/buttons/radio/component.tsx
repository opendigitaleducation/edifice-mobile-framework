import * as React from 'react';
import { Pressable, View } from 'react-native';

import theme from '~/app/theme';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, SmallText } from '~/framework/components/text';

import styles from './styles';
import type { RadioButtonProps } from './types';

export const RadioButton = ({ isChecked, isDisabled, label, size = 'default', style, onPress }: RadioButtonProps) => {
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
        <NamedSVG
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
