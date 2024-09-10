import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { cardShadow } from '~/framework/components/card/base';
import { UI_SIZES } from '~/framework/components/constants';

export const BUTTON_ICON_SIZE = UI_SIZES.elements.icon.small;

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.palette.grey.white,
    paddingHorizontal: UI_SIZES.spacing.minor,
    paddingVertical: UI_SIZES.spacing.tiny,
    borderRadius: UI_SIZES.radius.medium,
    marginVertical: UI_SIZES.spacing.tiny,
    ...cardShadow,
  },
  infos: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: UI_SIZES.spacing.small,
  },
  imagePicture: {
    height: UI_SIZES.elements.icon.xlarge,
    width: UI_SIZES.elements.icon.xlarge,
    objectFit: 'contain',
  },
});
