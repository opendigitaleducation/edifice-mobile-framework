import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { getScaleWidth, UI_SIZES } from '~/framework/components/constants';

const pictureSize = getScaleWidth(207);

export default StyleSheet.create({
  buttons: {
    flex: 1,
    justifyContent: 'center',
  },
  discoverButton: {
    marginTop: UI_SIZES.spacing.medium,
  },
  mainContainer: {
    flex: 5,
  },
  page: {
    paddingBottom: UI_SIZES.screen.bottomInset + UI_SIZES.spacing.big,
    paddingTop: UI_SIZES.screen.topInset + UI_SIZES.spacing.big,
  },
  swiper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.ui.background.page,
    borderColor: theme.palette.primary.regular,
    borderWidth: 1.5,
  },
  swiperActive: {
    backgroundColor: theme.palette.primary.regular,
    borderWidth: 0,
  },
  swiperItem: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    paddingBottom: 80,
  },
  swiperItemImage: {
    width: pictureSize,
    height: pictureSize,
    marginVertical: UI_SIZES.spacing.large,
  },
  swiperItemText: {
    textAlign: 'center',
    paddingHorizontal: UI_SIZES.spacing.large,
  },
  title: {
    color: theme.palette.primary.regular,
    alignSelf: 'center',
  },
});
