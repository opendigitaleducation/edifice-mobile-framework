import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  page: { backgroundColor: theme.palette.grey.black },
  // eslint-disable-next-line react-native/no-color-literals
  errorScreen: {
    backgroundColor: 'transparent',
    height: UI_SIZES.screen.height,
    justifyContent: 'center',
  },
  title: {
    width: undefined,
  },
});
