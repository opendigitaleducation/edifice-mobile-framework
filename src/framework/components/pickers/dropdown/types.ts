import { DropDownPickerProps } from 'react-native-dropdown-picker';

export type DropdownSize = 'big' | 'medium';

export type DropdownVariant = 'outlined' | 'standard';

export type DropdownPickerProps<T> = DropDownPickerProps<T> & {
  iconName?: string;
  size?: DropdownSize;
  variant?: DropdownVariant;
};
