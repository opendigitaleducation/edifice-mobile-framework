import React from 'react';
import { ColorValue, StyleSheet, TouchableOpacity, View } from 'react-native';

import moment, { Moment } from 'moment';
import { PanGestureHandler, ScrollView, State } from 'react-native-gesture-handler';

import {
  COURSE_WIDTH,
  DEFAULT_SLOT_COUNT,
  ITimetableCourse,
  LINE_HEIGHT,
  minutes,
  SLOT_HOUR_HEIGHT,
  TIME_COLUMN_WIDTH,
  TimeSlotLine,
} from './Timetable';

import theme from '~/app/theme';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { SmallText } from '~/framework/components/text';
import { ISlot } from '~/framework/modules/viescolaire/edt/model';

const styles = StyleSheet.create({
  courseContainer: {
    overflow: 'hidden',
    padding: UI_SIZES.spacing.tiny / 2,
    position: 'absolute',
  },
  weekdayContainer: {
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingVertical: UI_SIZES.spacing.tiny,
  },
  weekdayListContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: UI_SIZES.spacing.small,
  },
});

interface ITimetableDiaryProps {
  courses: ITimetableCourse[];
  mainColor: string;
  slots: ISlot[];
  startDate: Moment;
  displaySunday?: boolean;
  initialSelectedDate?: Moment;
  renderCourse: (course: ITimetableCourse) => React.JSX.Element;
  renderCourseHalf: (course: ITimetableCourse) => React.JSX.Element;
  renderHeader?: (day: Moment) => React.JSX.Element;
}

interface ITimetableDiaryState {
  selectedDate: Moment;
  slots: ISlot[];
  weekdays: Moment[];
}

interface IWeekdayButtonProps {
  color: ColorValue;
  date: Moment;
  isSelected: boolean;
  onPress: () => void;
}

const WeekdayButton = (props: IWeekdayButtonProps) => {
  const { date, isSelected } = props;
  return (
    <TouchableOpacity onPress={props.onPress} style={[styles.weekdayContainer, isSelected && { backgroundColor: props.color }]}>
      <SmallText style={{ color: isSelected ? theme.ui.text.inverse : theme.ui.text.light }}>
        {date.format('ddd').charAt(0).toUpperCase()}
      </SmallText>
      <SmallText style={isSelected && { color: theme.ui.text.inverse }}>{date.format('DD')}</SmallText>
    </TouchableOpacity>
  );
};

export default class TimetableDiary extends React.PureComponent<ITimetableDiaryProps, ITimetableDiaryState> {
  constructor(props) {
    super(props);
    const { displaySunday, initialSelectedDate, slots, startDate } = this.props;
    this.state = {
      selectedDate: initialSelectedDate ?? this.props.startDate.clone(),
      slots: slots.length ? slots : this.getDefaultSlots(),
      weekdays: this.getWeekdays(startDate, displaySunday),
    };
  }

  componentDidUpdate(prevProps) {
    const { displaySunday, initialSelectedDate, startDate } = this.props;

    /* on week change */
    if (!prevProps.startDate.isSame(startDate, 'd')) {
      const newSelected = initialSelectedDate ? initialSelectedDate.clone() : startDate.clone();
      this.setState({
        selectedDate: newSelected,
        weekdays: this.getWeekdays(startDate, displaySunday),
      });
    }
  }

  organizeColumns = (courses: ITimetableCourse[]): [ITimetableCourse[], ITimetableCourse[], ITimetableCourse[]] => {
    const columns: [ITimetableCourse[], ITimetableCourse[], ITimetableCourse[]] = [[], [], []];
    const elementsColumns: number[] = [];

    // sorting events by ascending startDate
    courses.sort((a, b) => a.startDate.diff(b.startDate));

    // placing each event in its column: 0 => full width, 1 => half left, 2 => half right
    courses.forEach(course => {
      let col = 0;
      // event m starts before d
      const iEndInMiddle = courses.findIndex(m => m.endDate.isAfter(course.startDate) && m.startDate.isBefore(course.startDate));
      if (iEndInMiddle > -1) {
        col = (elementsColumns[iEndInMiddle] % 2) + 1;
      }
      // event m starts after d
      const iStartInMiddle = courses.findIndex(m => m.startDate.isAfter(course.startDate) && m.startDate.isBefore(course.endDate));
      if (iStartInMiddle > -1 && col === 0) {
        col = 1;
      }
      // event m start at the same time as d and ends before or after d
      const iStartSameEndMiddle = courses.findIndex(
        m =>
          JSON.stringify(m) !== JSON.stringify(course) &&
          m.startDate.isSame(course.startDate) &&
          (m.endDate.isBefore(course.endDate) || m.endDate.isAfter(course.endDate)),
      );
      // event m starts and ends at the same time as d
      const isSameTime = courses.findIndex(
        m =>
          JSON.stringify(m) !== JSON.stringify(course) && m.startDate.isSame(course.startDate) && m.endDate.isSame(course.endDate),
      );

      if ((isSameTime > -1 || iStartSameEndMiddle > -1) && col === 0) {
        if (elementsColumns.length > 0) {
          col = (elementsColumns[elementsColumns.length - 1] % 2) + 1;
        } else col = 1;
      }
      if (!isNaN(col)) {
        if (course.color !== '') columns[col].push(course);
        elementsColumns.push(col);
      }
    });
    return columns;
  };

  getWeekdays = (startDate: Moment, displaySunday?: boolean): Moment[] => {
    const weekdays: Moment[] = [];
    const numberOfDays = displaySunday ? 7 : 6;

    for (let index = 0; index < numberOfDays; index += 1) {
      weekdays.push(startDate.clone().add(index, 'day'));
    }
    return weekdays;
  };

  getDefaultSlots = (): ISlot[] => {
    const slots: ISlot[] = [];
    const startTime = moment('2000-01-01 08:00');

    for (let index = 0; index < DEFAULT_SLOT_COUNT; index += 1) {
      slots.push({
        endHour: startTime.clone().add(index + 1, 'hour'),
        id: index.toString(),
        name: index.toString(),
        startHour: startTime.clone().add(index, 'hour'),
      });
    }
    return slots;
  };

  renderElement = (course: ITimetableCourse, renderCourse: (course: ITimetableCourse) => React.JSX.Element, side?: string) => {
    const { slots } = this.state;
    let displayedStart = course.startDate.clone();
    let displayedEnd = course.endDate.clone();
    let iSlotStart: number = -1;
    let iSlotEnd: number = -1;

    // finding starting and ending slots for this element
    slots
      .sort((a, b) => a.startHour.diff(b.startHour))
      .forEach((slot, i, array) => {
        if (
          iSlotStart < 0 &&
          minutes(slot.startHour) <= minutes(displayedStart) &&
          minutes(slot.endHour) >= minutes(displayedStart)
        ) {
          iSlotStart = i;
        }
        if (iSlotEnd < 0 && minutes(slot.startHour) <= minutes(displayedEnd) && minutes(slot.endHour) >= minutes(displayedEnd)) {
          iSlotEnd = i;
        }
        if (
          iSlotStart < 0 &&
          i < array.length - 1 &&
          minutes(slot.endHour) < minutes(displayedStart) &&
          minutes(array[i + 1].startHour) > minutes(displayedStart)
        ) {
          displayedStart = array[i + 1].startHour.clone();
          iSlotStart = i + 1;
        }
        if (
          iSlotEnd < 0 &&
          i > 0 &&
          minutes(slot.startHour) > minutes(displayedEnd) &&
          minutes(array[i - 1].endHour) < minutes(displayedEnd)
        ) {
          displayedEnd = array[i - 1].endHour.clone();
          iSlotEnd = i - 1;
        }
      });

    // course does not fit in the slots
    if (iSlotStart < 0 || iSlotEnd < 0) return null;

    // computing absolute coordinates
    const top =
      iSlotStart * SLOT_HOUR_HEIGHT +
      ((minutes(displayedStart) - minutes(slots[iSlotStart].startHour)) * SLOT_HOUR_HEIGHT) /
        (minutes(slots[iSlotStart].endHour) - minutes(slots[iSlotStart].startHour)) +
      LINE_HEIGHT / 2;
    const bottom =
      iSlotEnd * SLOT_HOUR_HEIGHT +
      ((minutes(displayedEnd) - minutes(slots[iSlotEnd].startHour)) * SLOT_HOUR_HEIGHT) /
        (minutes(slots[iSlotEnd].endHour) - minutes(slots[iSlotEnd].startHour)) +
      LINE_HEIGHT / 2;

    const positionStyle = {
      height: bottom - top,
      left: side !== 'r' ? TIME_COLUMN_WIDTH : undefined,
      right: side === 'r' ? UI_SIZES.spacing.minor : undefined,
      top,
      width: side ? COURSE_WIDTH / 2 : COURSE_WIDTH,
    };

    return <View style={[styles.courseContainer, positionStyle]}>{renderCourse(course)}</View>;
  };

  renderScrollView = () => {
    const { courses, renderCourse, renderCourseHalf } = this.props;
    const { selectedDate, slots } = this.state;
    const latestSlot = slots.reduce((latest, slot) => (slot.endHour > latest.endHour ? slot : latest));
    const organizedCourses = this.organizeColumns(courses.filter(d => d.startDate.isSame(selectedDate, 'day')));

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: SLOT_HOUR_HEIGHT * slots.length + SLOT_HOUR_HEIGHT / 2 }}>
        {slots.map((slot, index) => (
          <TimeSlotLine key={index} text={slot.startHour.format('HH:mm')} style={{ top: SLOT_HOUR_HEIGHT * index }} />
        ))}
        <TimeSlotLine text={latestSlot.endHour.format('HH:mm')} style={{ top: SLOT_HOUR_HEIGHT * slots.length }} />
        {organizedCourses[0].map(d => this.renderElement(d, renderCourse))}
        {organizedCourses[1].map(d => this.renderElement(d, renderCourseHalf, 'l'))}
        {organizedCourses[2].map(d => this.renderElement(d, renderCourseHalf, 'r'))}
      </ScrollView>
    );
  };

  public handleStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END && nativeEvent.oldState === State.ACTIVE) {
      const { selectedDate, weekdays } = this.state;
      const index = weekdays.findIndex(weekDay => weekDay.isSame(selectedDate, 'd'));

      if (nativeEvent.translationX < 0 && index < weekdays.length - 1) {
        this.setState({ selectedDate: weekdays[index + 1] });
      } else if (nativeEvent.translationX > 0 && index > 0) {
        this.setState({ selectedDate: weekdays[index - 1] });
      }
    }
  };

  public render() {
    const { mainColor, renderHeader } = this.props;
    const { selectedDate, weekdays } = this.state;

    return (
      <View style={UI_STYLES.flex1}>
        <View style={styles.weekdayListContainer}>
          {weekdays.map((weekday, index) => (
            <WeekdayButton
              key={index}
              date={weekday}
              color={mainColor}
              isSelected={weekday.isSame(selectedDate, 'd')}
              onPress={() => this.setState({ selectedDate: weekday })}
            />
          ))}
        </View>
        {renderHeader ? renderHeader(selectedDate) : null}
        <PanGestureHandler onHandlerStateChange={this.handleStateChange}>{this.renderScrollView()}</PanGestureHandler>
      </View>
    );
  }
}
