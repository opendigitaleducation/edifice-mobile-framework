import { StyleSheet } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: UI_SIZES.spacing.minor,
    rowGap: UI_SIZES.spacing.minor,
  },
});
