import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import styles from './styles';
import { LargeButtonProps } from './types';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallBoldText } from '~/framework/components/text';

export const LargeButton = ({ action, icon, style, text }: LargeButtonProps) => {
  return (
    <TouchableOpacity onPress={action} style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Svg
          name={icon}
          width={UI_SIZES.elements.icon.default}
          height={UI_SIZES.elements.icon.default}
          fill={theme.palette.grey.black}
        />
      </View>
      <SmallBoldText style={styles.text}>{text}</SmallBoldText>
    </TouchableOpacity>
  );
};
