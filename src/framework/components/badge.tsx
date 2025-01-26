import * as React from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import { UI_SIZES } from './constants';
import { Picture, Svg } from './picture';
import { CaptionBoldText } from './text';

import theme from '~/app/theme';
import { PictureProps } from './picture';

export interface IBadgeProps {
  content: number | string | PictureProps;
  color?: string | ColorValue;
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: UI_SIZES.dimensions.height.large / 2,
    height: UI_SIZES.dimensions.height.large,
    justifyContent: 'center',
    width: UI_SIZES.dimensions.height.large,
  },
  badgePicture: { height: 16, width: 16 },
});

export const Badge = ({ color, content }: IBadgeProps) => {
  const picture = React.useMemo(() => {
    if (!content) {
      return null;
    } else if (typeof content === 'number') {
      return <CaptionBoldText style={{ color: theme.ui.text.inverse }}>{content > 99 ? '99+' : content}</CaptionBoldText>;
    } else if (typeof content === 'string') {
      return <Svg height={12} width={12} color={theme.ui.text.inverse} name={content} />;
    } else {
      if (content.type === 'Icon') {
        return <Picture {...content} size={12} color={theme.ui.text.inverse} />;
      } else if (content.type === 'Svg') {
        return <Picture fill={theme.ui.text.inverse} {...content} style={[styles.badgePicture, content.style as object]} />;
      } else {
        return <Picture {...content} style={[styles.badgePicture, content.style as object]} />;
      }
    }
  }, [content]);
  if (!content) {
    return null;
  }
  return <View style={[styles.badge, { backgroundColor: color || theme.ui.text.light }]}>{picture}</View>;
};
