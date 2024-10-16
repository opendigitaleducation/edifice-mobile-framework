import { StyleSheet } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  listContentContainer: {
    rowGap: UI_SIZES.spacing.medium,
    padding: UI_SIZES.spacing.medium,
  },
  listHeaderContainer: {
    zIndex: 99,
    rowGap: UI_SIZES.spacing.small,
  },
});
