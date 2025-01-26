import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { CardTopContentProps } from './types';

import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallBoldText, SmallText } from '~/framework/components/text';

export default function CardTopContent(props: CardTopContentProps) {
  const { bold, image, statusColor, statusIcon, statusText, style, text, textColor } = props;

  const Text = bold ? SmallBoldText : SmallText;

  const renderStatus = () => {
    if (statusText) return <SmallBoldText style={{ color: statusColor }}>{statusText}</SmallBoldText>;
    if (statusIcon)
      return (
        <Svg
          name={statusIcon}
          width={UI_SIZES.dimensions.width.medium}
          height={UI_SIZES.dimensions.height.medium}
          fill={statusColor}
        />
      );
  };

  return (
    <View style={[styles.topContent, style]}>
      <View style={styles.imageLabel}>
        {image}
        <Text numberOfLines={1} style={[styles.label, { ...(textColor ? { color: textColor } : null) }]}>
          {text}
        </Text>
      </View>
      {renderStatus()}
    </View>
  );
}
