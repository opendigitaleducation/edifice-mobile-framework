import moment, { DurationInputArg1, DurationInputArg2, Moment } from 'moment';

import { I18n } from '~/app/i18n';

import { uppercaseFirstLetter } from './string';

export enum DayOfTheWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum DayReference {
  PAST,
  TODAY,
  FUTURE,
}

moment.relativeTimeThreshold('m', 60);

export const today = () => {
  return moment();
};

export const addTime = (date: Moment, amount: DurationInputArg1, unit: DurationInputArg2) => {
  return date.clone().add(amount, unit);
};

export const subtractTime = (date: Moment, amount: DurationInputArg1, unit: DurationInputArg2) => {
  return date.clone().subtract(amount, unit);
};

export const getDayOfTheWeek = (date: Moment) => {
  if (!date || !date.isValid()) {
    return I18n.get('date-invalid');
  }
  return date.locale('en').format('dddd').toLowerCase();
};

export const isDateWeekend = (date: Moment) => {
  return date.day() === 6 || date.day() === 0;
};

export const isDateGivenWeekday = (date: Moment, weekdayNumber: number) => {
  const weekday = date.day();
  return weekday === weekdayNumber;
};

export const displayPastDate = (pastDate: Moment, longFormat?: boolean) => {
  const now = moment();

  if (!pastDate || !pastDate.isValid()) {
    return I18n.get('date-invalid');
  }

  if (longFormat) {
    if (/*less than 2d*/ pastDate.isSameOrAfter(subtractTime(now, 2, 'day').startOf('day'))) {
      return pastDate.format('LL - H:mm');
    } else return pastDate.format('dddd LL');
  }

  if (/*less than 1min*/ pastDate.isAfter(subtractTime(now, 1, 'minute'))) {
    return I18n.get('date-now');
  } else if (/*less than 3h*/ pastDate.isSameOrAfter(subtractTime(now, 3, 'hour'))) {
    return pastDate.fromNow();
  } else if (/*today*/ pastDate.isSame(now, 'day')) {
    return pastDate.format('HH[:]mm');
  } else if (/*yesterday*/ addTime(pastDate, 1, 'day').isSame(now, 'day')) {
    return I18n.get('date-yesterday');
  } else if (/*less than 7d*/ pastDate.isSameOrAfter(subtractTime(now, 6, 'day').startOf('day'))) {
    return pastDate.format('dddd');
  } else if (/*this year*/ pastDate.isSame(now, 'year')) {
    return pastDate.format('D MMM');
  } /*before this year*/ else return pastDate.format('D MMM YYYY');
};

export const displayDate = (date: Moment, format?: 'short' | 'extraShort', showHours?: boolean) => {
  const now = moment();
  const isShortFormat = format === 'short';
  const isExtraShortFormat = format === 'extraShort';
  const thisYearFormat = isShortFormat ? 'ddd D MMM' : isExtraShortFormat ? 'DD/MM' : 'dddd D MMMM';
  const otherYearFormat = isShortFormat ? 'ddd D MMM Y' : isExtraShortFormat ? 'DD/MM/YY' : 'dddd D MMMM Y';

  if (!date || !date.isValid()) {
    return I18n.get('date-invalid');
  }

  if (/*yesterday*/ addTime(date, 1, 'day').isSame(now, 'day')) {
    return I18n.get('date-yesterday');
  } else if (/*today*/ date.isSame(now, 'day')) {
    return I18n.get('date-today');
  } else if (/*tomorrow*/ subtractTime(date, 1, 'day').isSame(now, 'day')) {
    return I18n.get('date-tomorrow');
  } else if (/*this year*/ date.isSame(now, 'year')) {
    return date.format(thisYearFormat);
  } /*other year*/ else return date.format(otherYearFormat);
};

export const displayWeekRange = (date: Moment) => {
  const startOfCurrentWeek = today().clone().day(1).startOf('day');
  const startOfDateWeek = date.clone().day(1).startOf('day');
  const endOfDateWeek = addTime(startOfDateWeek, 6, 'day');

  const isLastWeek = startOfDateWeek.isSame(subtractTime(startOfCurrentWeek, 1, 'week'));
  const isCurrentWeek = startOfDateWeek.isSame(startOfCurrentWeek);
  const isNextWeek = startOfDateWeek.isSame(addTime(startOfCurrentWeek, 1, 'week'));
  const isEndOfDateWeekCurrentYear = endOfDateWeek.isSame(today(), 'year');

  const startDateShort = startOfDateWeek.format('D');
  const startDateLong = startOfDateWeek.format('D MMM');
  const endDateShort = endOfDateWeek.format('D');
  const endDateLong = endOfDateWeek.format('D MMM');
  const endDateMonth = uppercaseFirstLetter(endOfDateWeek.format('MMMM'));
  const endDateYear = endOfDateWeek.format('Y');

  return isCurrentWeek
    ? I18n.get('date-week-current')
    : isLastWeek
      ? I18n.get('date-week-last', { startDate: startDateLong, endDate: endDateLong })
      : isNextWeek
        ? I18n.get('date-week-next', { startDate: startDateLong, endDate: endDateLong })
        : I18n.get('date-week-of', {
            startDate: startDateShort,
            endDate: endDateShort,
            month: endDateMonth,
            year: isEndOfDateWeekCurrentYear ? '' : endDateYear,
          });
};
