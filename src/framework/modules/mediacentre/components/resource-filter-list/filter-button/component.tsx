import React from 'react';
import { TouchableOpacity } from 'react-native';

import theme from '~/app/theme';
import { NamedSVG } from '~/framework/components/picture';
import { SmallActionText } from '~/framework/components/text';

import styles from './styles';
import { FilterButtonProps } from './types';

const FilterButton: React.FunctionComponent<FilterButtonProps> = ({ text, action }) => {
  return (
    <TouchableOpacity onPress={action} style={styles.mainContainer}>
      <SmallActionText>{text}</SmallActionText>
      <NamedSVG name="ui-rafterDown" width={16} height={16} fill={theme.palette.primary.regular} />
    </TouchableOpacity>
  );
};

export default FilterButton;
