import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { getScaleWidth, UI_SIZES } from '~/framework/components/constants';

export const DEFAULT_CARD_HEIGHT = getScaleWidth(80);
export const DEFAULT_IMAGE_WIDTH = getScaleWidth(60);
export const PIN_CARD_HEIGHT = getScaleWidth(100);
export const PIN_CARD_WIDTH = getScaleWidth(190);
export const PREVIEW_CARD_WIDTH = getScaleWidth(120);

export const defaultStyles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
    marginTop: 'auto',
  },
  iconContainer: {
    alignSelf: 'flex-start',
    padding: UI_SIZES.spacing.tiny,
    marginLeft: 'auto',
    marginRight: -UI_SIZES.spacing.minor,
    marginTop: -UI_SIZES.spacing.minor,
    borderTopRightRadius: UI_SIZES.radius.card,
    borderBottomLeftRadius: UI_SIZES.radius.card,
    backgroundColor: theme.palette.grey.pearl,
  },
  imageContainer: {
    height: '100%',
    width: DEFAULT_IMAGE_WIDTH,
    borderTopLeftRadius: UI_SIZES.radius.card,
    borderBottomLeftRadius: UI_SIZES.radius.card,
  },
  innerContainer: {
    flex: 1,
    marginHorizontal: UI_SIZES.spacing.minor,
    marginVertical: UI_SIZES.spacing.minor,
  },
  lowerContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
  },
  mainContainer: {
    flexDirection: 'row',
    height: DEFAULT_CARD_HEIGHT,
  },
  secondaryText: {
    flex: 1,
    color: theme.ui.text.light,
  },
  titleContainer: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  titleText: {
    flexShrink: 1,
    lineHeight: undefined,
  },
});

export const pinStyles = StyleSheet.create({
  copyActionContainer: {
    marginLeft: 'auto',
  },
  highlightContainer: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    columnGap: UI_SIZES.spacing.tiny,
  },
  imageContainer: {
    width: getScaleWidth(60),
  },
  lightText: {
    flexShrink: 1,
    color: theme.ui.text.light,
  },
  lowerContainer: {
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
  },
  mainContainer: {
    width: PIN_CARD_WIDTH,
    height: PIN_CARD_HEIGHT,
    padding: UI_SIZES.spacing.minor,
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  topContainer: {
    flex: 1,
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
  },
});

export const previewStyles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    columnGap: UI_SIZES.spacing.minor,
  },
  imageContainer: {
    flex: 1,
    height: 'auto',
    width: '100%',
  },
  mainContainer: {
    width: PREVIEW_CARD_WIDTH,
    height: PREVIEW_CARD_WIDTH,
    padding: UI_SIZES.spacing.minor,
    rowGap: UI_SIZES.spacing.tiny,
  },
});
