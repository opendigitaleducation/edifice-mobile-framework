import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, TextBold } from '~/framework/components/text';
import { LeftColoredItem } from '~/modules/viescolaire/viesco/components/Item';
import { SquareCheckbox } from '~/ui/forms/Checkbox';

const styles = StyleSheet.create({
  homeworkLeftColoredItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  homeworkView: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  sessionLeftColoredItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sessionView: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  sessionMatiereText: {
    textTransform: 'uppercase',
  },
  sessionAuthorText: {
    color: '#AFAFAF',
  },
});

export const HomeworkItem = ({
  onPress,
  title,
  subtitle,
  checked,
  disabled,
  onChange,
  hideCheckbox,
}: {
  onPress: () => void;
  title: string;
  subtitle: {
    id: number;
    label: string;
    rank: number;
    structure_id: string;
  };
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  hideCheckbox: boolean;
}) => (
  <LeftColoredItem shadow onPress={onPress} style={styles.homeworkLeftColoredItem} color="#FA9700">
    <View style={styles.homeworkView}>
      <TextBold>{title}</TextBold>
      <Text>{subtitle.label}</Text>
    </View>
    {hideCheckbox || <SquareCheckbox disabled={disabled} value={checked} color="#FA9700" onChange={onChange} />}
  </LeftColoredItem>
);

export const SessionItem = ({ onPress, matiere, author }: any) => (
  <LeftColoredItem shadow onPress={onPress} style={styles.sessionLeftColoredItem} color="#2bab6f">
    <View style={styles.sessionView}>
      <TextBold style={styles.sessionMatiereText}>{matiere}</TextBold>
      <Text style={styles.sessionAuthorText}>{author}</Text>
    </View>
  </LeftColoredItem>
);
