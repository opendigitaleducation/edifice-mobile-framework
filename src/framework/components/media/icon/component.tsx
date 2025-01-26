import * as React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { MediaIconProps } from './types';

import theme from '~/app/theme';
import { Picture } from '~/framework/components/picture';

export default function MediaIcon({ color, icon, iconSize, style }: MediaIconProps) {
  return (
    <View style={[styles.mediaIcon, style]}>
      <Picture type="Svg" name={icon} width={iconSize} height={iconSize} fill={color || theme.ui.text.inverse} />
    </View>
  );
}
