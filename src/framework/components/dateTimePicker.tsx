import React from 'react';
import { ColorValue, Platform, StyleSheet, ViewStyle } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import moment, { Moment } from 'moment';

import { TouchCardWithoutPadding } from './card/base';
import { UI_SIZES } from './constants';
import { Svg } from './picture';
import { SmallText } from './text';

import theme from '~/app/theme';

export interface DateTimePickerProps {
  mode: 'date' | 'time';
  value: Moment;
  disabled?: boolean;
  iconColor?: ColorValue;
  maximumDate?: Moment;
  minimumDate?: Moment;
  style?: ViewStyle;
  onChangeValue: (value: Moment) => void;
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: UI_SIZES.spacing.minor,
  },
  buttonText: {
    marginLeft: UI_SIZES.spacing.tiny,
  },
  dateTimePickerIos: {
    // fix space in IOS
    marginLeft: -10,
  },
});

const DateTimePickerIOS = (props: DateTimePickerProps) => {
  const [date, setDate] = React.useState<Moment>(props.value);

  return (
    <DateTimePicker
      mode={props.mode}
      onChange={(event, newDate) => {
        if (event.type === 'set') {
          setDate(moment(newDate));
          props.onChangeValue(moment(newDate));
        }
      }}
      value={date.toDate()}
      disabled={props.disabled}
      maximumDate={props.maximumDate?.toDate()}
      minimumDate={props.minimumDate?.toDate()}
      locale="fr-FR"
      style={[styles.dateTimePickerIos, props.style]}
    />
  );
};

const DateTimePickerAndroid = (props: DateTimePickerProps) => {
  const [date, setDate] = React.useState<Moment>(props.value);
  const [isPickerVisible, setPickerVisible] = React.useState<boolean>(false);

  const showPicker = () => setPickerVisible(true);

  return (
    <>
      <TouchCardWithoutPadding onPress={showPicker} disabled={props.disabled} style={[styles.buttonContainer, props.style]}>
        <Svg
          name={props.mode === 'date' ? 'ui-calendarLight' : 'ui-clock'}
          width={20}
          height={20}
          fill={props.iconColor ?? theme.palette.primary.regular}
        />
        <SmallText style={styles.buttonText}>{date.format(props.mode === 'date' ? 'L' : 'LT')}</SmallText>
      </TouchCardWithoutPadding>
      {isPickerVisible ? (
        <DateTimePicker
          mode={props.mode}
          is24Hour
          maximumDate={props.maximumDate?.toDate()}
          minimumDate={props.minimumDate?.toDate()}
          value={date.toDate()}
          onChange={(event, newDate) => {
            setPickerVisible(false);
            if (event.type !== 'dismissed') {
              setDate(moment(newDate));
              props.onChangeValue(moment(newDate));
            }
          }}
        />
      ) : null}
    </>
  );
};

export default (props: DateTimePickerProps) => {
  return Platform.OS === 'ios' ? <DateTimePickerIOS {...props} /> : <DateTimePickerAndroid {...props} />;
};
