import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import type { CallSummaryProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { Svg } from '~/framework/components/picture';
import { BodyBoldText, BodyText, HeadingSText } from '~/framework/components/text';
import { Call, CallEventType } from '~/framework/modules/viescolaire/presences/model';

const countEventType = (call: Call, eventType: CallEventType): number =>
  call.students.reduce((acc, item) => {
    return acc + (item.events.some(event => event.typeId === eventType) ? 1 : 0);
  }, 0);

export default function CallSummary(props: CallSummaryProps) {
  const studentCount = props.call.students.length;
  const absentCount = countEventType(props.call, CallEventType.ABSENCE);
  const latenessCount = countEventType(props.call, CallEventType.LATENESS);
  const departureCount = countEventType(props.call, CallEventType.DEPARTURE);

  return (
    <View style={styles.container}>
      <HeadingSText>{I18n.get('presences-call-summary-heading')}</HeadingSText>
      <View style={[styles.rowContainer, styles.wrap, styles.eventTypeGap]}>
        <View style={[styles.rowContainer, styles.presentCountContainer]}>
          <Svg name="presences" width={22} height={22} fill={theme.palette.status.success.regular} />
          <BodyText style={styles.eventTypeText}>{I18n.get('presences-call-summary-present')}</BodyText>
          <BodyBoldText>{`${studentCount - absentCount}/${studentCount}`}</BodyBoldText>
        </View>
        <View style={[styles.rowContainer, styles.eventTypeGap]}>
          <View style={styles.secondaryEventContainer}>
            <Svg
              name="ui-clock-alert"
              width={22}
              height={22}
              fill={latenessCount ? theme.palette.status.warning.regular : theme.palette.grey.graphite}
            />
            <BodyBoldText style={latenessCount ? styles.secondaryEventText : styles.lightText}>{latenessCount}</BodyBoldText>
          </View>
          <View style={styles.secondaryEventContainer}>
            <Svg
              name="ui-leave"
              width={22}
              height={22}
              fill={departureCount ? theme.palette.status.warning.regular : theme.palette.grey.graphite}
            />
            <BodyBoldText style={departureCount ? styles.secondaryEventText : styles.lightText}>{departureCount}</BodyBoldText>
          </View>
        </View>
      </View>
      <View style={styles.rowContainer}>
        <Svg
          name="ui-error"
          width={22}
          height={22}
          fill={absentCount ? theme.palette.status.failure.regular : theme.palette.grey.graphite}
        />
        <BodyText style={[styles.eventTypeText, !absentCount && styles.lightText]}>
          {I18n.get('presences-call-summary-absent')}
        </BodyText>
        <BodyBoldText style={!absentCount && styles.lightText}>{`${absentCount}/${studentCount}`}</BodyBoldText>
      </View>
    </View>
  );
}
