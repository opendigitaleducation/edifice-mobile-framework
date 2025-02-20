import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { getScaleHeight, getScaleWidth, UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  imageLoader: {
    backgroundColor: theme.palette.grey.pearl,
  },
  moduleImage: {
    alignItems: 'center',
    borderRadius: UI_SIZES.radius.medium,
    height: getScaleHeight(120),
    justifyContent: 'center',
    width: getScaleWidth(120),
  },
  moduleImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
