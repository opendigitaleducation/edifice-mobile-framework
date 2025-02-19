import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { TextSizeStyle } from '~/framework/components/text';

export default StyleSheet.create({
  grid: {
    backgroundColor: theme.palette.complementary.orange.pale,
    borderColor: theme.ui.text.regular,
    borderWidth: 2,
  },
  item: {
    borderColor: theme.palette.primary.regular,
    borderRadius: UI_SIZES.radius.mediumPlus,
    borderWidth: 2,
    height: TextSizeStyle.Medium.lineHeight * 5,
  },
});
