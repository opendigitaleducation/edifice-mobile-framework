import * as React from 'react';
import { ColorValue, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { TextField } from 'rn-material-ui-textfield';

import theme from '~/app/theme';
import PasswordInput from '~/framework/components/passwordInput';
import { TextFontStyle, TextSizeStyle } from '~/framework/components/text';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});

export type TextInputLineProps = {
  hasError: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder: string;
  inputRef: (ref: TextInput) => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  isPasswordField?: boolean;
  placeholderTextColor?: string;
  textColor?: string;
} & TextInputProps;

export class TextInputLine extends React.Component<
  {
    hasError: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder: string;
    inputRef: (ref: TextInput) => void;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<ViewStyle>;
    isPasswordField?: boolean;
    placeholderTextColor?: string;
    textColor?: ColorValue;
  } & TextInputProps
> {
  public render() {
    const { hasError, style, inputStyle, inputRef, isPasswordField, onBlur, onFocus, placeholderTextColor, textColor } = this.props;
    const inputProps = {
      ...this.props,
      ...TextFontStyle.Regular,
      ...TextSizeStyle.Medium,
      innerRef: r => inputRef(r),
      onBlur: () => onBlur && onBlur(),
      onFocus: () => onFocus && onFocus(),
      placeholderTextColor: placeholderTextColor || theme.ui.text.light,
      textColor: textColor || theme.ui.text.regular,
      underlineColorAndroid: 'transparent',
      autoCapitalize: 'none',
      containerStyle: style,
      inputContainerStyle: inputStyle,
      lineWidth: hasError ? 2 : 1,
      activeLineWidth: 2,
      baseColor: hasError ? theme.palette.status.failure.regular : theme.ui.border.input,
      tintColor: hasError ? theme.palette.status.failure.regular : theme.palette.primary.regular,
      invertVisibilityIcon: true,
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const TextComponent = isPasswordField ? PasswordInput : TextField;
    return (
      <View style={styles.container}>
        <TextComponent {...inputProps} />
      </View>
    );
  }
}
