import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { avatarSize } from '~/framework/modules/conversation/components/result-item';

export default StyleSheet.create({
  iconView: {
    width: avatarSize,
    aspectRatio: 1,
    padding: UI_SIZES.spacing.minor,
    borderRadius: UI_SIZES.radius.huge,
    backgroundColor: theme.palette.primary.pale,
  },
  iconViewBookmark: {
    backgroundColor: theme.palette.complementary.yellow.pale,
  },
  avatarViewBookmark: {
    backgroundColor: theme.palette.complementary.yellow.pale,
  },
  graphite: {
    color: theme.palette.grey.graphite,
  },
  flex1: {
    flex: 1,
  },
});
