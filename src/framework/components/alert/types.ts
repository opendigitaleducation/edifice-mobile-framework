import React from 'react';
import { StyleProp, Text, ViewProps, ViewStyle } from 'react-native';

import { IShades } from '~/app/theme';
import { PictureProps } from '~/framework/components/picture';

export interface AlertCardProps {
  type: 'error' | 'info' | 'success' | 'warning';
  text?: string | React.ReactElement<typeof Text>;
  icon?: PictureProps;
  label?: string;
  onLabelPress?: () => void;
  onClose?: () => void;
  renderCloseButton?: (colorShades: IShades, onClose?: () => void) => React.ReactElement | null;
  shadow?: boolean;
  containerProps?: ViewProps;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
