import { StyleSheet } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  //GLOBAL
  h18: {
    height: 18,
  },
  h16: {
    height: 14,
  },
  h14: {
    height: 14,
  },
  mb0: {
    marginBottom: 0,
  },
  //ELEMENTS
  page: {
    position: 'relative',
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.small,
  },
  title: {
    marginBottom: UI_SIZES.spacing.small,
  },
  element: {
    paddingVertical: UI_SIZES.spacing.minor,
    paddingHorizontal: UI_SIZES.spacing.tiny,
    flexDirection: 'row',
    alignItems: 'center',
  },
  texts: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  name: {
    marginBottom: UI_SIZES.spacing.tiny,
  },
});
