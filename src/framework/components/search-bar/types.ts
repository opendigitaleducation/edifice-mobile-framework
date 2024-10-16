import { ViewStyle } from 'react-native';

export interface SearchBarProps {
  query: string;
  containerStyle?: ViewStyle;
  placeholder?: string;
  onChangeQuery: (value: string) => void;
  onClear?: () => void;
  onSearch?: () => void;
}
