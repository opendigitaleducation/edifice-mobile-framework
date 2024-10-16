import { TextInputProps as RNTextInputProps, TextStyle } from 'react-native';

export interface TextInputProps extends RNTextInputProps {
  annotation?: string;
  annotationStyle?: TextStyle;
  showError?: boolean;
  showSuccess?: boolean;
  showIconCallback?: boolean;
  toggleIconOn?: string;
  toggleIconOff?: string;
  disabled?: boolean;
  testIDToggle?: string;
  testIDCaption?: string;
  onToggle?: () => void;
}
