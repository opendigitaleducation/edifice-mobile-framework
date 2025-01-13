import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import moment, { Moment } from 'moment';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { SmallText } from '~/framework/components/text';
import { ISlot } from '~/framework/modules/viescolaire/edt/model';

export const LINE_HEIGHT = 32;
export const TIME_COLUMN_WIDTH = 56;
export const COURSE_WIDTH = UI_SIZES.screen.width - TIME_COLUMN_WIDTH - UI_SIZES.spacing.minor;

const styles = StyleSheet.create({
  courseContainer: {
    overflow: 'hidden',
    paddingVertical: UI_SIZES.spacing.tiny / 2,
    position: 'absolute',
    borderColor: theme.palette.grey.cloudy,
    borderBottomWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.small,
  },
  timeSlotLineContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: LINE_HEIGHT,
    position: 'absolute',
    width: '100%',
  },
  timeSlotSeparatorContainer: {
    backgroundColor: theme.palette.grey.cloudy,
    height: 1,
    width: COURSE_WIDTH,
  },
  timeSlotText: {
    color: theme.palette.grey.graphite,
    textAlign: 'center',
    width: TIME_COLUMN_WIDTH,
  },
});

export const minutes = (m: Moment): number => {
  return m.minutes() + m.hours() * 60;
};

export const momentForDay = (m: Moment, day: Moment): Moment => {
  return m.clone().set({
    year: day.year(),
    month: day.month(),
    date: day.date(),
  });
};

export type ITimetableCourse = {
  endDate: Moment;
  startDate: Moment;
};

interface ITimetableProps<CourseType extends ITimetableCourse = ITimetableCourse> {
  courses: CourseType[];
  slots: ISlot[];
  displaySunday?: boolean;
  date?: Moment;
  renderCourse: (course: CourseType) => React.ReactElement;
  renderCourseHalf: (course: CourseType) => React.ReactElement;
  renderHeader?: (day: Moment) => React.ReactElement;
}

export interface ITimeSlotLineProps {
  style: ViewStyle;
  text: string;
}

export const TimeSlotLine = (props: ITimeSlotLineProps) => {
  return (
    <View style={[styles.timeSlotLineContainer, props.style]}>
      <SmallText style={styles.timeSlotText}>{props.text}</SmallText>
      <View style={styles.timeSlotSeparatorContainer} />
    </View>
  );
};

export const DEFAULT_SLOT_START = '08:00';
export const DEFAULT_SLOT_COUNT = 10;
export const DEFAULT_SLOT_DURATION_MINUTES = 60;
export const SLOT_HOUR_HEIGHT = 70;

const getDefaultSlots = (): ISlot[] => {
  const slots: ISlot[] = [];
  const startTime = moment(`2000-01-01 ${DEFAULT_SLOT_START}`);

  for (let index = 0; index < DEFAULT_SLOT_COUNT; index += 1) {
    slots.push({
      endHour: startTime.clone().add((index + 1) * DEFAULT_SLOT_DURATION_MINUTES, 'minute'),
      id: index.toString(),
      name: index.toString(),
      startHour: startTime.clone().add(index * DEFAULT_SLOT_DURATION_MINUTES, 'minute'),
    });
  }
  return slots;
};

const computeSlotLines = (
  date: Moment,
  slots: ISlot[],
  courses: ITimetableCourse[],
): [ITimeSlotLineProps[], moment.Moment, moment.Moment] => {
  const lines: Map<string, ITimeSlotLineProps> = new Map();
  const setLine = (m: moment.Moment) => {
    lines.set(m.format('HH:mm'), {
      style: { top: (SLOT_HOUR_HEIGHT * minutes(m)) / 60 },
      text: m.format('HH:mm'),
    });
  };
  let startTime: moment.Moment = momentForDay(slots[0].startHour, date);
  let endTime: moment.Moment = momentForDay(slots[0].endHour, date);
  // Compute lines for defined slots
  slots.forEach(slot => {
    let slotStart = momentForDay(slot.startHour, date);
    let slotEnd = momentForDay(slot.endHour, date);
    setLine(slotStart);
    setLine(slotEnd);
    if (slotStart.isBefore(startTime)) startTime = slotStart;
    if (slotEnd.isAfter(endTime)) endTime = slotEnd;
  });
  // Compute max/min for courses + create extra slots for every hour if necesary
  courses.forEach(course => {
    let courseStart = momentForDay(course.startDate, date);
    let courseEnd = momentForDay(course.endDate, date);
    if (courseStart.isBefore(startTime)) {
      const current = endTime.clone().startOf('hour').add(1, 'hour');
      while (current.isAfter(courseEnd)) {
        current.subtract(1, 'hour');
        setLine(current);
      }
      startTime = current;
    }
    if (courseEnd.isAfter(endTime)) {
      const current = endTime.clone().startOf('hour');
      while (current.isBefore(courseEnd)) {
        current.add(1, 'hour');
        setLine(current);
      }
      endTime = current;
    }
  });
  return [[...lines.values()], startTime, endTime];
};

const organizeColumns = <CourseType extends ITimetableCourse>(
  courses: CourseType[],
): [CourseType[], CourseType[], CourseType[]] => {
  const columns: [CourseType[], CourseType[], CourseType[]] = [[], [], []];
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
      m => JSON.stringify(m) !== JSON.stringify(course) && m.startDate.isSame(course.startDate) && m.endDate.isSame(course.endDate),
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

const TimetableCourse = <CourseType extends ITimetableCourse>({
  course,
  half,
  renderCourse,
}: {
  course: CourseType;
  half?: 'l' | 'r';
  renderCourse: ITimetableProps<CourseType>['renderCourse'] | ITimetableProps<CourseType>['renderCourseHalf'];
}) => {
  const top = React.useMemo(() => (minutes(course.startDate) / 60) * SLOT_HOUR_HEIGHT + LINE_HEIGHT / 2, [course.startDate]);
  const bottom = React.useMemo(() => (minutes(course.endDate) / 60) * SLOT_HOUR_HEIGHT + LINE_HEIGHT / 2, [course.endDate]);

  const positionStyle = React.useMemo(
    () => ({
      height: bottom - top + UI_SIZES.border.thin,
      left: half !== 'r' ? TIME_COLUMN_WIDTH : undefined,
      right: half === 'r' ? UI_SIZES.spacing.minor : undefined,
      top,
      width: half ? COURSE_WIDTH / 2 : COURSE_WIDTH,
    }),
    [half, top, bottom],
  );
  return <View style={[styles.courseContainer, positionStyle]}>{renderCourse(course)}</View>;
};

const getCourseKey = (course: ITimetableCourse) => `${course.startDate.format()}${course.endDate.format()}`;

export default <CourseType extends ITimetableCourse>({
  courses,
  slots,
  displaySunday = false,
  date = moment(),
  renderCourse,
  renderCourseHalf,
  renderHeader,
}: ITimetableProps<CourseType>) => {
  const realSlots = slots.length ? slots : getDefaultSlots();
  const coursesThisDay = courses.filter(d => d.startDate.isSame(date, 'day'));
  const [slotLines, startTime, endTime] = React.useMemo(
    () => computeSlotLines(date, realSlots, coursesThisDay),
    [realSlots, coursesThisDay],
  );
  const organizedCourses = organizeColumns(coursesThisDay);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        backgroundColor: theme.palette.grey.fog,
        height: ((minutes(endTime) - minutes(startTime)) / 60) * SLOT_HOUR_HEIGHT + LINE_HEIGHT,
        position: 'relative',
        top: -(minutes(startTime) / 60) * SLOT_HOUR_HEIGHT,
      }}>
      {slotLines.map((slot, index) => (
        <TimeSlotLine key={index} {...slot} />
      ))}
      {organizedCourses[0].map(d => (
        <TimetableCourse course={d} renderCourse={renderCourse} key={getCourseKey(d)} />
      ))}
      {organizedCourses[1].map(d => (
        <TimetableCourse course={d} half="l" renderCourse={renderCourseHalf} key={getCourseKey(d)} />
      ))}
      {organizedCourses[2].map(d => (
        <TimetableCourse course={d} half="r" renderCourse={renderCourseHalf} key={getCourseKey(d)} />
      ))}
    </ScrollView>
  );
};
