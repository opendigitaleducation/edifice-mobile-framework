import React from 'react';
import { StyleSheet, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { CaptionText } from '~/framework/components/text';

const styles = StyleSheet.create({
  barContainer: {
    width: '100%',
    height: 16,
    backgroundColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.medium,
  },
  barFilledContainer: {
    maxWidth: '100%',
    height: '100%',
    backgroundColor: theme.palette.primary.dark,
    borderRadius: UI_SIZES.radius.medium,
  },
  container: {
    alignItems: 'center',
  },
});

interface ProgressBarProps {
  formElementCount: number;
  position: number;
}

export const ProgressBar = (props: ProgressBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.barFilledContainer, { width: `${(props.position * 100) / props.formElementCount}%` }]} />
      </View>
      <CaptionText>
        {I18n.get('form-distribution-progressbar-progress', { current: props.position, total: props.formElementCount })}
      </CaptionText>
    </View>
  );
};
