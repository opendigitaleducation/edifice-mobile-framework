import * as React from 'react';
import { View } from 'react-native';

import PictureButton from '~/framework/components/buttons/picture/component';
import { SmallText } from '~/framework/components/text';
import DayCell from '~/framework/modules/homework/components/day-cell';
import { addTime, displayWeekRange, isDateGivenWeekday, isDateWeekend, subtractTime, today } from '~/framework/util/date';

import styles from './styles';
import { DaySelectorProps } from './types';

const daySelector = (_props: DaySelectorProps) => {
  const isTodayWeekend = isDateWeekend(today());
  const defaultSelectedDate = isTodayWeekend
    ? addTime(today(), 1, 'week').startOf('week')
    : addTime(today(), 1, 'day').startOf('day');
  const defaultStartDate = defaultSelectedDate.clone().startOf('week');

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedDate, setSelectedDate] = React.useState(defaultSelectedDate);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [startDate, setStartDate] = React.useState(defaultStartDate);

  const isPastDisabled = startDate.isSame(subtractTime(defaultStartDate, 8, 'week'));
  const isFutureDisabled = startDate.isSame(addTime(defaultStartDate, 8, 'week'));
  const isWithinSelectedWeek = selectedDate.isBetween(startDate, addTime(startDate, 6, 'day'), undefined, '[]');

  return (
    <View style={styles.container}>
      <View style={styles.weekContainer}>
        <PictureButton
          iconName="ui-rafterLeft"
          disabled={isPastDisabled}
          action={() => setStartDate(subtractTime(startDate, 1, 'week'))}
        />
        <SmallText style={styles.week}>{displayWeekRange(startDate)}</SmallText>
        <PictureButton
          iconName="ui-rafterRight"
          disabled={isFutureDisabled}
          action={() => setStartDate(addTime(startDate, 1, 'week'))}
        />
      </View>
      <View style={styles.daysContainer}>
        <DayCell
          dayOfTheWeek="monday"
          onPress={() => setSelectedDate(startDate)}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 1)}
        />
        <DayCell
          dayOfTheWeek="tuesday"
          onPress={() => setSelectedDate(addTime(startDate, 1, 'day'))}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 2)}
        />
        <DayCell
          dayOfTheWeek="wednesday"
          onPress={() => setSelectedDate(addTime(startDate, 2, 'day'))}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 3)}
        />
        <DayCell
          dayOfTheWeek="thursday"
          onPress={() => setSelectedDate(addTime(startDate, 3, 'day'))}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 4)}
        />
        <DayCell
          dayOfTheWeek="friday"
          onPress={() => setSelectedDate(addTime(startDate, 4, 'day'))}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 5)}
        />
        <DayCell
          dayOfTheWeek="saturday"
          onPress={() => setSelectedDate(addTime(startDate, 5, 'day'))}
          isSelected={isWithinSelectedWeek && isDateGivenWeekday(selectedDate, 6)}
        />
      </View>
    </View>
  );
};

export default daySelector;
