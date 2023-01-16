import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    margin: UI_SIZES.spacing.big,
  },
  primaryText: {
    textAlign: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    right: -UI_SIZES.spacing.major,
    bottom: '10%',
    maxHeight: 300,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  secondaryText: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  actionContainerEnabled: {
    backgroundColor: theme.palette.secondary.regular,
    borderColor: theme.palette.secondary.regular,
    opacity: 1,
  },
  actionContainerDisabled: {
    backgroundColor: theme.ui.text.light,
    borderColor: theme.ui.text.light,
    opacity: 0.5,
  },
});
