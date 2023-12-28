import React from 'react';
import { View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';

import styles from './styles';
import { CardFooterProps } from './types';

export default function CardFooter(props: CardFooterProps) {
  const { icon, text } = props;
  return (
    <View style={styles.cardFooter}>
      <Picture
        cached
        type="NamedSvg"
        name={icon}
        width={UI_SIZES.dimensions.width.medium}
        height={UI_SIZES.dimensions.height.medium}
        fill={theme.ui.text.regular}
        style={styles.icon}
      />
      <SmallText>{text}</SmallText>
    </View>
  );
}
