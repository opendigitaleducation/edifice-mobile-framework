import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  item: {
    backgroundColor: theme.ui.background.card,
    borderRadius: UI_SIZES.radius.card,
    elevation: 7,
    flexDirection: 'row',
    marginLeft: UI_SIZES.spacing.big,
    marginTop: UI_SIZES.spacing.small,
    padding: UI_SIZES.spacing.medium,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  status: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  viewArrow: {
    justifyContent: 'center',
    marginLeft: UI_SIZES.spacing.small,
  },
  viewTexts: {
    flex: 1,
  },
  viewTitle: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
