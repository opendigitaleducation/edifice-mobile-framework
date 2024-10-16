import { ViewStyle } from 'react-native';

import { CheckboxProps } from '~/framework/components/checkbox';

export interface CheckboxButtonProps extends CheckboxProps {
  title: string;
  customListItemStyle?: ViewStyle;
}
