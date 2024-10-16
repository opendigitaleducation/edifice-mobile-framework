import * as React from 'react';
import { AppState, AppStateStatus, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, deviceFontScale, getScaleWidth } from '~/framework/components/constants';
import { SmallBoldText } from '~/framework/components/text';
import { DayReference } from '~/framework/util/date';

import { styles } from './styles';
import { DayCellProps } from './types';

const DayCell = ({ dayOfTheWeek, dayReference, isSelected, onPress }: DayCellProps) => {
  const [currentFontScale, setCurrentFontScale] = React.useState(deviceFontScale());
  const currentState = React.useRef<AppStateStatus>();
  const handleAppStateChange = React.useCallback(
    (nextAppState: AppStateStatus) => {
      currentState.current = nextAppState;
      const newFontScale = deviceFontScale();
      if (nextAppState === 'active' && newFontScale !== currentFontScale) {
        setCurrentFontScale(newFontScale);
      }
    },
    [currentFontScale],
  );
  React.useEffect(() => {
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateListener.remove();
    };
  }, [handleAppStateChange]);
  const containerPadding = UI_SIZES.spacing.minor;
  const textWidth = getScaleWidth(UI_SIZES.dimensions.width.large) * currentFontScale;
  const dayCellDimension = textWidth + containerPadding * 2;

  const isPastDay = dayReference === DayReference.PAST;
  const isToday = dayReference === DayReference.TODAY;
  const containerStyle = {
    padding: containerPadding,
    ...(isSelected && { backgroundColor: theme.color.homework.days[dayOfTheWeek]?.background }),
  };
  const absoluteContainerStyle = {
    width: dayCellDimension,
    height: dayCellDimension,
    ...(isSelected
      ? {
          borderColor: theme.color.homework.days[dayOfTheWeek]?.[isPastDay ? 'light' : 'accent'],
          borderWidth: UI_SIZES.border.small,
        }
      : isToday
        ? { borderColor: theme.palette.grey.graphite }
        : undefined),
  };
  const textStyle = { width: textWidth, ...(isPastDay && { color: theme.palette.grey.graphite }) };
  const text = I18n.get(`date-${dayOfTheWeek}`);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, containerStyle]}>
      <View style={[styles.absoluteContainer, absoluteContainerStyle]} />
      <SmallBoldText style={[styles.text, textStyle]}>{text}</SmallBoldText>
    </TouchableOpacity>
  );
};

export default DayCell;
