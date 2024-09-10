import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { getScaleWidth, UI_SIZES } from '~/framework/components/constants';

const ICON_SIZE = getScaleWidth(80);

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.ui.background.card,
  },
  container: {
    paddingHorizontal: UI_SIZES.spacing.large,
    paddingVertical: UI_SIZES.spacing.huge,
    flex: 1,
    justifyContent: 'space-around',
  },
  infos: {
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginTop: UI_SIZES.spacing.big,
  },
});
