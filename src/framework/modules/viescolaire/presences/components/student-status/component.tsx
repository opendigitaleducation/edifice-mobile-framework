import * as React from 'react';
import { View } from 'react-native';

import EventButton from './event-button';
import styles from './styles';
import type { StudentStatusProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { Svg } from '~/framework/components/picture';
import { BodyText, SmallText } from '~/framework/components/text';
import { CallEventType } from '~/framework/modules/viescolaire/presences/model';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';

export default function StudentStatus({
  createAbsence,
  deleteAbsence,
  dismissBottomSheet,
  exemption_attendance,
  hasAbsenceViewAccess,
  lastCourseAbsent,
  openEvent,
  student,
  style,
}: StudentStatusProps) {
  if (!student) return null;
  const isAbsent = student.events.some(event => event.typeId === CallEventType.ABSENCE);
  const hasSecondaryEvent = student.events.some(event => [CallEventType.LATENESS, CallEventType.DEPARTURE].includes(event.typeId));

  const openLateness = () => openEvent(student, CallEventType.LATENESS);

  const openDeparture = () => openEvent(student, CallEventType.DEPARTURE);

  const onPressPresent = () => {
    if (isAbsent) {
      deleteAbsence(student.events.find(event => event.typeId === CallEventType.ABSENCE)!.id);
    }
    dismissBottomSheet();
  };

  const onPressAbsent = () => {
    if (hasAbsenceViewAccess) {
      openEvent(student, CallEventType.ABSENCE);
    } else {
      if (isAbsent) {
        deleteAbsence(student.events.find(event => event.typeId === CallEventType.ABSENCE)!.id);
      } else {
        createAbsence(student.id);
      }
      dismissBottomSheet();
    }
  };

  const renderInfo = () => {
    if (exemption_attendance || lastCourseAbsent)
      return (
        <View style={styles.info}>
          <Svg
            name={exemption_attendance ? 'ui-block' : 'ui-error-past'}
            height={20}
            width={20}
            fill={exemption_attendance ? theme.palette.status.warning.regular : theme.palette.status.failure.regular}
          />
          <SmallText>
            {I18n.get(
              exemption_attendance
                ? 'presences-call-studentstatus-info-exemptionattendance'
                : 'presences-call-studentstatus-info-lastcourseabsent',
            )}
          </SmallText>
        </View>
      );
  };

  return (
    <View style={style}>
      <View style={styles.nameContainer}>
        <SingleAvatar size={48} userId={student.id} status={2} />
        <BodyText numberOfLines={1}>{student.name}</BodyText>
      </View>
      {renderInfo()}
      <View style={styles.content}>
        {exemption_attendance ? (
          <>
            <BodyText>{I18n.get('presences-call-studentstatus-exemptionattendance')}</BodyText>
            <PrimaryButton
              text={I18n.get('presences-call-studentstatus-backtocall')}
              action={dismissBottomSheet}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <EventButton
              backgroundColor={theme.palette.status.warning.pale}
              iconName="ui-clock-alert"
              text={I18n.get('presences-call-studentstatus-lateness')}
              isSelected={student.events.some(event => event.typeId === CallEventType.LATENESS)}
              onPress={openLateness}
            />
            <EventButton
              backgroundColor={theme.palette.status.warning.pale}
              iconName="ui-leave"
              text={I18n.get('presences-call-studentstatus-departure')}
              isSelected={student.events.some(event => event.typeId === CallEventType.DEPARTURE)}
              onPress={openDeparture}
            />
            <View style={styles.separatorContainer} />
            <EventButton
              backgroundColor={theme.palette.status.success.pale}
              iconName="ui-success_outline"
              text={I18n.get('presences-call-studentstatus-present')}
              disabled={hasSecondaryEvent}
              isSelected={!student.events.length}
              onPress={onPressPresent}
            />
            <EventButton
              backgroundColor={theme.palette.status.failure.pale}
              iconName="ui-error"
              text={I18n.get('presences-call-studentstatus-absent')}
              isSelected={isAbsent}
              onPress={onPressAbsent}
            />
          </>
        )}
      </View>
    </View>
  );
}
