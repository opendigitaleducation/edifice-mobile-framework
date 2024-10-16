import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES, getScaleWidth } from '~/framework/components/constants';
const diameter = getScaleWidth(200);
const radius = diameter / 2;
const visibleHeight = radius - UI_SIZES.elements.tabbarHeight;
export default StyleSheet.create({
  container: {
    height: visibleHeight,
  },
  subContainer: {
    backgroundColor: theme.palette.primary.pale,
    width: diameter,
    height: diameter,
    borderRadius: radius,
  },
});
