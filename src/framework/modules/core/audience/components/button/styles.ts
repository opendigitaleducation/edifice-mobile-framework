import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  buttonView: {
    alignSelf: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  reactions: {
    borderColor: theme.palette.grey.cloudy,
    borderWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.medium,
    padding: UI_SIZES.spacing.medium,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.big,
    position: 'absolute',
    left: 0,
    backgroundColor: theme.palette.grey.white,
    shadowColor: theme.ui.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 16,
  },
  reactionsText: {
    color: theme.palette.grey.white,
    textAlign: 'center',
  },
  reactionsTextView: {
    position: 'absolute',
    backgroundColor: theme.palette.grey.black,
    top: -30,
    paddingHorizontal: UI_SIZES.spacing.minor,
    paddingVertical: UI_SIZES.spacing._LEGACY_tiny,
    borderRadius: UI_SIZES.radius.medium,
  },
});

export default styles;
