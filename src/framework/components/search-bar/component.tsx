import React, { useRef, useState } from 'react';
import { Platform, TextInput, TouchableOpacity } from 'react-native';

import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { NamedSVG } from '~/framework/components/picture';

import styles from './styles';
import { SearchBarProps } from './types';

export const SearchBar = (props: SearchBarProps) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setFocused] = useState(false);
  const borderColor = isFocused
    ? theme.palette.secondary.light
    : props.query
      ? theme.palette.grey.stone
      : theme.palette.grey.cloudy;

  const focusInput = () => inputRef.current?.focus();

  const handleClear = () => {
    props.onChangeQuery('');
    props.onClear?.();
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => setFocused(false);

  return (
    <TouchableOpacity onPress={focusInput} activeOpacity={1} style={[styles.container, { borderColor }, props.containerStyle]}>
      <NamedSVG name="ui-search" width={20} height={20} fill={theme.ui.text.regular} style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        value={props.query}
        onChangeText={props.onChangeQuery}
        onSubmitEditing={props.onSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={props.placeholder}
        placeholderTextColor={theme.ui.text.light}
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="search"
        returnKeyType="search"
        style={[styles.textInput, Platform.OS === 'ios' && styles.textInputIOS]}
      />
      {props.query.length ? <IconButton icon="ui-close" action={handleClear} style={styles.clearButton} /> : null}
    </TouchableOpacity>
  );
};
