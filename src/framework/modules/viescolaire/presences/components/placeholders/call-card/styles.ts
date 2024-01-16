import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES, getScaleWidth } from '~/framework/components/constants';

export default StyleSheet.create({
  //GLOBAL
  br4: {
    borderRadius: UI_SIZES.radius.small,
  },
  h22: {
    height: getScaleWidth(22),
  },
  h24: {
    height: getScaleWidth(24),
  },
  mb0: {
    marginBottom: 0,
  },
  w22: {
    width: getScaleWidth(22),
  },
  //ELEMENTS
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: UI_SIZES.spacing.small,
    borderWidth: 1,
    borderRadius: UI_SIZES.radius.medium,
    borderColor: theme.palette.grey.pearl,
  },
  heading: {
    backgroundColor: theme.palette.grey.cloudy,
  },
  leftContainer: {
    flexGrow: 1,
    rowGap: UI_SIZES.spacing.minor,
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.small,
  },
  status: {
    backgroundColor: theme.palette.grey.cloudy,
  },
  statusContainer: {
    justifyContent: 'center',
    padding: UI_SIZES.spacing.small,
    backgroundColor: theme.palette.grey.pearl,
  },
});
