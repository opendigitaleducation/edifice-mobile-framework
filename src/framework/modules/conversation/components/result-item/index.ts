import { ViewStyle } from 'react-native';

import { UI_SIZES, getScaleWidth } from '~/framework/components/constants';

import { ConversationResultGroupItem } from './group';
import { ConversationResultUserItem } from './user';

export const avatarSize = getScaleWidth(32);

export const containerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: UI_SIZES.spacing.tiny,
  paddingVertical: UI_SIZES.spacing.minor,
  columnGap: UI_SIZES.spacing.minor,
};

export { ConversationResultGroupItem, ConversationResultUserItem };
