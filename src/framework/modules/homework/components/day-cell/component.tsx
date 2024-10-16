import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { SmallBoldText } from '~/framework/components/text';

import styles from './styles';
import { DayCellProps } from './types';

const DayCell = ({ dayOfTheWeek, isSelected, onPress }: DayCellProps) => {
  const dayColor = {
    borderColor: theme.color.homework.days[dayOfTheWeek]?.accent,
    backgroundColor: theme.color.homework.days[dayOfTheWeek]?.background,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        isSelected && {
          borderWidth: UI_SIZES.border.small,
          ...dayColor,
        },
      ]}>
      <SmallBoldText>{I18n.get(`date-${dayOfTheWeek}`)}</SmallBoldText>
    </TouchableOpacity>
  );
};

export default DayCell;
