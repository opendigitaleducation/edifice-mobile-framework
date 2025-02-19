import { PixelRatio, StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { TextSizeStyle } from '~/framework/components/text';

export default StyleSheet.create({
  contentContainer: {
    padding: UI_SIZES.spacing.big / 2,
  },
  folderItem: {
    padding: UI_SIZES.border.thin,
  },
  folderLabel: {
    lineHeight: TextSizeStyle.Small.lineHeight,
    position: 'relative',
    textAlign: 'center',
  },
  folderThumbnail: {
    alignItems: 'center',
    aspectRatio: UI_SIZES.aspectRatios.thumbnail,
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: theme.palette.complementary.orange.pale,
    borderColor: theme.ui.text.regular,
    borderWidth: 2,
  },
  item: {
    borderRadius: UI_SIZES.radius.mediumPlus,
    flex: 1,
    margin: UI_SIZES.spacing.big / 2,
    overflow: 'hidden',
  },
  itemThumbnail: {
    aspectRatio: UI_SIZES.aspectRatios.thumbnail,
  },
  itemThumbnailPlaceholder: {
    aspectRatio: UI_SIZES.aspectRatios.thumbnail,
    borderRadius: 0,
    height: undefined,
    width: '100%',
  },
  labelCaption: {
    lineHeight: TextSizeStyle.Small.lineHeight,
  },
  labelContainer: {
    flexDirection: 'column',
    paddingBottom: UI_SIZES.spacing.small,
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingTop: UI_SIZES.spacing.minor,
  },
  labelContainerPlaceholder: {
    flexDirection: 'column',
    height: 2 * TextSizeStyle.Small.lineHeight * PixelRatio.getFontScale() + UI_SIZES.spacing.minor + UI_SIZES.spacing.small,
    justifyContent: 'space-around',
    paddingBottom: UI_SIZES.spacing.small,
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingTop: UI_SIZES.spacing.minor,
  },
  resourceItem: {
    backgroundColor: theme.ui.background.card,
    borderColor: theme.palette.grey.cloudy,
    borderWidth: UI_SIZES.border.thin,
  },
});
