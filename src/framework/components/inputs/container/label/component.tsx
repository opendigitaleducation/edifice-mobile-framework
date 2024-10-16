import React, { useCallback } from 'react';
import { View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { SmallBoldText, SmallItalicText } from '~/framework/components/text';

import styles from './styles';
import { LabelIndicator, LabelProps } from './types';

export default function Label(props: LabelProps) {
  const { text, icon, indicator } = props;

  const renderIcon = useCallback(() => {
    return (
      <NamedSVG
        name={icon!}
        width={UI_SIZES.elements.icon.small}
        height={UI_SIZES.elements.icon.small}
        fill={theme.palette.grey.black}
        style={styles.labelIcon}
      />
    );
  }, [icon]);

  const renderLabelIndicator = useCallback(() => {
    if (indicator === LabelIndicator.REQUIRED) return <SmallItalicText style={styles.labelRequired}> *</SmallItalicText>;
    return <SmallItalicText style={styles.labelOptional}> - Optionnel</SmallItalicText>;
  }, [indicator]);

  const renderLabel = useCallback(() => {
    return (
      <View style={styles.label}>
        {icon ? renderIcon() : null}
        <SmallBoldText>{text}</SmallBoldText>
        {indicator ? renderLabelIndicator() : null}
      </View>
    );
  }, [icon, indicator, text, renderIcon, renderLabelIndicator]);

  return renderLabel();
}
