import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { getScaleImageSize, UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  animationView: { flex: 1 },
  animationWrapper: { aspectRatio: 3 },
  buttonDiscover: { marginTop: UI_SIZES.spacing.medium },
  buttonReview: { marginTop: UI_SIZES.spacing.large },
  imageView: { height: getScaleImageSize(200), width: getScaleImageSize(280) },
  imageWrapper: { alignItems: 'center', marginTop: UI_SIZES.spacing.large },
  noMarginBottom: { marginBottom: 0 },
  quoteAuthor: { color: theme.palette.grey.graphite, marginBottom: UI_SIZES.spacing.large, textAlign: 'right' },
  textWrapper: { padding: UI_SIZES.spacing.big, paddingTop: UI_SIZES.spacing.large },
});
