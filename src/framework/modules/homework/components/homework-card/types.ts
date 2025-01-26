import { ViewStyle } from 'react-native';

import { Moment } from 'moment';

export interface HomeworkCardProps {
  title: string;
  content: string;
  date: Moment;
  finished: boolean;
  onPress: () => void;
  style?: ViewStyle;
}
