import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import styles from './styles';
import type { EventButtonProps } from './types';

import theme from '~/app/theme';
import { Svg } from '~/framework/components/picture';
import { BodyBoldText, BodyText } from '~/framework/components/text';

export default function EventButton(props: EventButtonProps) {
  const TextComponent = props.disabled || props.isSelected ? BodyBoldText : BodyText;
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={props.disabled}
      style={[
        styles.container,
        props.isSelected && { backgroundColor: props.backgroundColor },
        props.disabled && styles.containerDisabled,
      ]}>
      <Svg name={props.iconName} width={24} height={24} fill={theme.palette.grey.black} />
      <TextComponent>{props.text}</TextComponent>
    </TouchableOpacity>
  );
}
