import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.palette.grey.white,
    padding: UI_SIZES.spacing.medium,
  },
  flatlist: {
    paddingTop: UI_SIZES.spacing.medium,
  },
  headerItem: {
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
    alignItems: 'center',
  },
  headerItemTextFocused: {
    color: theme.palette.primary.regular,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_SIZES.spacing.minor,
    paddingHorizontal: UI_SIZES.spacing.small,
    columnGap: UI_SIZES.spacing.small,
  },
  noReactionView: {
    backgroundColor: theme.palette.grey.white,
  },
  noReactionTitle: {
    color: theme.palette.grey.black,
  },
  tabBarContainer: {
    backgroundColor: theme.palette.grey.white,
    borderBottomWidth: UI_SIZES.border.thin,
    borderBottomColor: theme.palette.grey.cloudy,
  },

  tabBarIndicatorContainer: {
    height: 2,
    backgroundColor: theme.palette.primary.regular,
  },
});

export default styles;
