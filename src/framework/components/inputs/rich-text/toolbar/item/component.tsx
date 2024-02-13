import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';

import styles from './styles';
import { RichToolbarItemProps } from './types';

export const RichToolbarItem = (props: RichToolbarItemProps) => {
  const renderColor = () => {
    if (props.disabled) return theme.palette.grey.stone;
    if (props.fill) return props.fill;
    return theme.palette.grey.black;
  };
  return (
    <TouchableOpacity
      disabled={props.disabled}
      onPress={props.onSelected}
      style={[styles.item, props.selected ? styles.itemSelected : {}]}>
      <NamedSVG name={props.icon} fill={renderColor()} height={UI_SIZES.elements.icon.small} width={UI_SIZES.elements.icon.small} />
    </TouchableOpacity>
  );
};
