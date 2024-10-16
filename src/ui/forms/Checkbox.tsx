import styled from '@emotion/native';
import * as React from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import theme from '~/app/theme';
import { Icon } from '~/framework/components/picture/Icon';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

// eslint-disable-next-line @typescript-eslint/naming-convention
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Checkbox = ({ checked, onUncheck, onCheck }: { checked: boolean; onUncheck?: () => void; onCheck?: () => void }) => (
  <TapCircle onPress={() => (checked ? onUncheck && onUncheck() : onCheck && onCheck())} checked={checked}>
    <Icon size={17} name="checked" color={theme.ui.text.inverse} />
  </TapCircle>
);

const squareCheckboxStyle = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    height: 25,
    width: 25,
    borderColor: theme.palette.grey.grey,
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SquareCheckbox = ({
  value,
  onChange,
  disabled,
  color,
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
