import { ViewStyle } from 'react-native';

export interface LargeButtonProps {
  action: () => void;
  icon: string;
  text: string;
  style?: ViewStyle;
  testID?: string;
}
