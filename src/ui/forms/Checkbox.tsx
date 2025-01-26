import * as React from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import styled from '@emotion/native';

import theme from '~/app/theme';
import { Icon } from '~/framework/components/picture';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

const TapCircle = styled(TouchableOpacity)<{ checked: boolean }>(
  {
    alignItems: 'center',
    borderRadius: 14,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
  ({ checked = false }) => ({
    backgroundColor: checked ? theme.palette.primary.regular : theme.ui.text.inverse,
    borderColor: checked ? theme.palette.primary.regular : theme.palette.grey.grey,
    borderWidth: checked ? 0 : 2,
  }),
);

export const Checkbox = ({ checked, onCheck, onUncheck }: { checked: boolean; onUncheck?: () => void; onCheck?: () => void }) => (
  <TapCircle onPress={() => (checked ? onUncheck && onUncheck() : onCheck && onCheck())} checked={checked}>
    <Icon size={17} name="checked" color={theme.ui.text.inverse} />
  </TapCircle>
);

const squareCheckboxStyle = StyleSheet.create({
  square: {
    alignItems: 'center',
    borderColor: theme.palette.grey.grey,
    borderRadius: 3,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
});

export const SquareCheckbox = ({
  color,
  disabled,
  onChange,
  value,
}: {
  value: boolean;
  onChange?: () => void;
  disabled?: boolean;
  color?: ColorValue;
}) => {
  const checkedStyle = value
    ? { backgroundColor: color, borderWidth: 0 }
    : { backgroundColor: theme.palette.grey.fog, borderWidth: 2 };
  const opacity = disabled ? 0.3 : 1;

  return (
    <View style={{ opacity }}>
      <TouchableOpacity disabled={disabled} onPress={onChange} style={[squareCheckboxStyle.square, checkedStyle]}>
        <Icon size={17} name="checked" color={theme.palette.grey.fog} />
      </TouchableOpacity>
    </View>
  );
};
