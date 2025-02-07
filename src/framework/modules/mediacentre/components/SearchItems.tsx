import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallActionText } from '~/framework/components/text';

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.minor,
    borderWidth: 2,
    borderRadius: 50,
    borderColor: theme.palette.primary.regular,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_SIZES.spacing.minor,
  },
  buttonIcon: {
    marginRight: UI_SIZES.spacing.tiny,
  },
});

export interface ISearchBarHandle {
  blur: () => void;
  clear: () => void;
}

interface ISearchBarProps {
  onSubmitEditing: (query: string) => void;
  ref: React.RefObject<ISearchBarHandle>;
}

interface IIconButtonTextProps {
  color?: string;
  icon: string;
  text: string;

  onPress: () => void;
}

export const SearchBar: React.FunctionComponent<ISearchBarProps> = forwardRef<ISearchBarHandle, ISearchBarProps>(
  (props: ISearchBarProps, ref) => {
    const [value, setValue] = useState<string>('');
    const inputRef = useRef<TextInput>(null);

    const onSearch = () => {
      if (value.length) {
        props.onSubmitEditing(value);
      }
    };

    const blur = () => inputRef.current?.blur();

    const clear = () => {
      inputRef.current?.clear();
      setValue('');
    };

    useImperativeHandle(ref, () => ({ blur, clear }));

    return (
      <View style={styles.searchBarContainer}>
        <TextInput
          defaultValue={value}
          placeholder={I18n.get('mediacentre-home-searchbar-placeholder')}
          returnKeyType="search"
          clearButtonMode="while-editing"
          onChangeText={text => setValue(text)}
          onSubmitEditing={onSearch}
          style={styles.searchInput}
          ref={inputRef}
        />
      </View>
    );
  },
);

export const IconButtonText: React.FunctionComponent<IIconButtonTextProps> = (props: IIconButtonTextProps) => (
  <TouchableOpacity style={styles.buttonContainer} onPress={props.onPress}>
    <Svg name="ui-search" width={18} height={18} fill={props.color ?? theme.palette.primary.regular} style={styles.buttonIcon} />
    <SmallActionText>{props.text}</SmallActionText>
  </TouchableOpacity>
);
