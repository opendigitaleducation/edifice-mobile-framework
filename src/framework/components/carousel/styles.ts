import { StyleSheet } from 'react-native';

import theme from '~/app/theme';

export default StyleSheet.create({
  page: { backgroundColor: theme.palette.grey.black },
  pinchable: { flex: 1 },
  image: { flex: 1, resizeMode: 'contain' },
  webview: { flex: 1, backgroundColor: theme.palette.grey.black },
});
