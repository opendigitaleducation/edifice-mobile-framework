import { StyleSheet } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: UI_SIZES.spacing.tiny,
    paddingHorizontal: UI_SIZES.spacing.small,
  },
  headerButton: {
    marginLeft: 'auto',
  },
  listContentContainer: {
    columnGap: UI_SIZES.spacing.small,
    padding: UI_SIZES.spacing.small,
  },
  listFooterContainer: {
    alignSelf: 'center',
  },
});
