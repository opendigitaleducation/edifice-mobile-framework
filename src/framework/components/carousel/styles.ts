import { StyleSheet } from 'react-native';

import theme from '~/app/theme';

import { UI_SIZES } from '../constants';

export default StyleSheet.create({
  page: { backgroundColor: theme.palette.grey.black },
  pinchable: { width: UI_SIZES.screen.width },
  container: {
    margin: 'auto',
    width: UI_SIZES.screen.width,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  webview: { flex: 1, backgroundColor: theme.palette.grey.black },
});
