import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  page: {
    backgroundColor: theme.palette.grey.darkness,
  },
  playerLandscape: {
    backgroundColor: theme.palette.grey.darkness,
    height: UI_SIZES.screen.width,
    width: UI_SIZES.screen.height,
  },
  playerPortrait: {
    backgroundColor: theme.palette.grey.darkness,
    height: UI_SIZES.screen.height - UI_SIZES.screen.topInset - UI_SIZES.screen.bottomInset,
    marginBottom: UI_SIZES.screen.bottomInset,
    marginTop: UI_SIZES.screen.topInset,
    width: UI_SIZES.screen.width,
  },
  externalPlayerPortrait: { marginTop: 0 },
  // eslint-disable-next-line react-native/no-color-literals
  errorScreen: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingTop: 0,
  },
  poster: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
