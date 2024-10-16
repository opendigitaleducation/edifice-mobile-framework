import { StyleSheet } from 'react-native';

import theme, { defaultTheme } from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  logContainer: {
    flexDirection: 'row',
    padding: UI_SIZES.spacing.minor,
  },
  logMessageContainer: {
    width: '80%',
    paddingLeft: UI_SIZES.spacing.tiny,
  },
  logSeverity: {
    fontWeight: 'bold',
  },
  logTimeAndSeverityContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '20%',
  },
  page: {
    backgroundColor: theme.palette.grey.white,
  },
  pausedBanner: {
    backgroundColor: defaultTheme.palette.status.failure.regular,
    padding: UI_SIZES.spacing.minor,
    alignItems: 'center',
  },
  searchBar: {
    height: UI_SIZES.dimensions.height.huge,
    borderColor: theme.palette.grey.cloudy,
    borderWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.medium,
    paddingHorizontal: UI_SIZES.spacing.minor,
    marginBottom: UI_SIZES.spacing.minor,
  },
  searchBarContainer: {
    margin: UI_SIZES.spacing.small,
  },
  separator: {
    height: UI_SIZES.border.thin,
    backgroundColor: theme.palette.grey.cloudy,
  },
  separatorContainer: {
    paddingVertical: UI_SIZES.spacing.small,
    paddingHorizontal: UI_SIZES.spacing.minor,
  },
});
