import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  listFooterContainer: {
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.tiny,
    rowGap: UI_SIZES.spacing.tiny,
  },
  listHeaderContainer: {
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingTop: UI_SIZES.spacing.medium,
    paddingBottom: UI_SIZES.spacing.big,
    marginBottom: UI_SIZES.spacing.tiny,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.grey.cloudy,
  },
  pageContainer: {
    backgroundColor: theme.palette.grey.white,
  },
  separatorContainer: {
    height: 1,
    marginVertical: UI_SIZES.spacing.tiny,
    backgroundColor: theme.palette.grey.cloudy,
  },
  studentStatusContainer: {
    paddingHorizontal: UI_SIZES.spacing.big,
    paddingTop: UI_SIZES.spacing.large,
    paddingBottom: UI_SIZES.spacing.large + UI_SIZES.screen.bottomInset,
  },
  summaryContainer: {
    paddingVertical: UI_SIZES.spacing.medium,
  },
  validateContainer: {
    marginVertical: UI_SIZES.spacing.medium,
  },
});
