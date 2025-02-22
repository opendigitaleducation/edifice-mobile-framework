import * as React from 'react';

import { Moment } from 'moment';

import styles from './styles';

import { I18n } from '~/app/i18n';
import { BodyText, CaptionBoldText, NestedBoldText } from '~/framework/components/text';
import { AccountType } from '~/framework/modules/auth/model';
import HistoryEventCard from '~/framework/modules/viescolaire/presences/components/history-event-card';
import {
  Absence,
  CommonEvent,
  EventType,
  ForgottenNotebook,
  Incident,
  Punishment,
} from '~/framework/modules/viescolaire/presences/model';
import appConf from '~/framework/util/appConf';

const formatAbsenceDates = (startDate: Moment, endDate: Moment): string => {
  if (!endDate.isSame(startDate, 'day')) {
    return I18n.get('presences-history-eventcard-fromdate', { end: endDate.format('D MMMM'), start: startDate.format('D') });
  } else if (appConf.is1d) {
    const timeLabel = I18n.get(
      startDate.get('hour') < 12 ? 'presences-history-eventcard-morning' : 'presences-history-eventcard-afternoon',
    );
    return `${startDate.format('D MMMM')} (${timeLabel})`;
  } else {
    return `${startDate.format('D MMMM')} ${I18n.get('presences-history-eventcard-absence-time', {
      end: endDate.format('H'),
      start: startDate.format('H'),
    })}`;
  }
};

export const AbsenceCard = ({ event }: { event: CommonEvent }) => {
  const isSingleDay = event.endDate.isSame(event.startDate, 'day');

  const getEventLabel = () => {
    switch (event.type) {
      case EventType.NO_REASON:
        return I18n.get(appConf.is1d ? 'presences-history-eventcard-noreason-1d' : 'presences-history-eventcard-noreason-2d');
      case EventType.REGULARIZED:
        return I18n.get(appConf.is1d ? 'presences-history-eventcard-regularized-1d' : 'presences-history-eventcard-regularized-2d');
      case EventType.UNREGULARIZED:
      default:
        return I18n.get(
          appConf.is1d ? 'presences-history-eventcard-unregularized-1d' : 'presences-history-eventcard-unregularized-2d',
        );
    }
  };

  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {getEventLabel()}
        {event.type !== EventType.REGULARIZED
          ? I18n.get(isSingleDay ? 'presences-history-eventcard-on' : 'presences-history-eventcard-from')
          : null}
        <NestedBoldText>{formatAbsenceDates(event.startDate, event.endDate)}</NestedBoldText>
      </BodyText>
      {event.type !== EventType.NO_REASON && event.reasonLabel ? (
        <CaptionBoldText style={styles.secondaryText}>
          {I18n.get('presences-history-eventcard-reason', { reason: event.reasonLabel })}
        </CaptionBoldText>
      ) : null}
    </HistoryEventCard>
  );
};

export const DepartureCard = ({ event }: { event: CommonEvent }) => {
  const duration = event.endDate.diff(event.startDate, 'minutes');

  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {I18n.get('presences-history-eventcard-departure-start')}
        <NestedBoldText>{I18n.get('presences-history-eventcard-departure-duration', { duration })}</NestedBoldText>
        {I18n.get('presences-history-eventcard-departure-declared')}
        <NestedBoldText>
          {I18n.get('presences-history-eventcard-departure-date', {
            date: event.startDate.format('DD MMMM'),
            time: event.endDate.format('H'),
          })}
        </NestedBoldText>
      </BodyText>
      {event.comment ? (
        <CaptionBoldText style={styles.secondaryText}>
          {I18n.get('presences-history-eventcard-reason', { reason: event.comment })}
        </CaptionBoldText>
      ) : null}
    </HistoryEventCard>
  );
};

export const ForgottenNotebookCard = ({ event }: { event: ForgottenNotebook }) => {
  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {I18n.get('presences-history-eventcard-forgottennotebook')}
        <NestedBoldText>{event.date.format('D MMMM')}</NestedBoldText>
      </BodyText>
    </HistoryEventCard>
  );
};

export const IncidentCard = ({ event }: { event: Incident }) => {
  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {I18n.get('presences-history-eventcard-incident', { level: event.description })}
        <NestedBoldText>{event.date.format('D MMMM (H[h]mm)')}</NestedBoldText>
      </BodyText>
      {event.typeLabel ? (
        <CaptionBoldText style={styles.secondaryText}>
          {I18n.get('presences-history-eventcard-type', { type: event.typeLabel })}
        </CaptionBoldText>
      ) : null}
    </HistoryEventCard>
  );
};

export const LatenessCard = ({ event }: { event: CommonEvent }) => {
  const duration = event.endDate.diff(event.startDate, 'minutes');

  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {I18n.get('presences-history-eventcard-lateness-start')}
        <NestedBoldText>{I18n.get('presences-history-eventcard-lateness-duration', { duration })} </NestedBoldText>
        {I18n.get('presences-history-eventcard-lateness-declared')}
        <NestedBoldText>
          {I18n.get('presences-history-eventcard-lateness-date', {
            date: event.startDate.format('DD MMMM'),
            time: event.startDate.format('H'),
          })}
        </NestedBoldText>
      </BodyText>
    </HistoryEventCard>
  );
};

export const PunishmentCard = ({ event }: { event: Punishment }) => {
  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {I18n.get('presences-history-eventcard-punishment')}
        <NestedBoldText>{event.createdAt.format('D MMMM (H[h]mm)')}</NestedBoldText>
      </BodyText>
      {event.typeLabel ? (
        <CaptionBoldText style={styles.secondaryText}>
          {I18n.get('presences-history-eventcard-type', { type: event.typeLabel })}
        </CaptionBoldText>
      ) : null}
    </HistoryEventCard>
  );
};

export const StatementAbsenceCard = ({ event, userType }: { event: Absence; userType?: AccountType }) => {
  const isSingleDay = event.endDate.isSame(event.startDate, 'day');

  return (
    <HistoryEventCard type={event.type}>
      <BodyText>
        {userType === AccountType.Relative
          ? I18n.get('presences-history-eventcard-statementabsence-relative', { childName: event.studentFirstName })
          : I18n.get('presences-history-eventcard-statementabsence-student')}
        {I18n.get(isSingleDay ? 'presences-history-eventcard-on' : 'presences-history-eventcard-from')}
        <NestedBoldText>{formatAbsenceDates(event.startDate, event.endDate)}</NestedBoldText>
      </BodyText>
      {event.description ? (
        <CaptionBoldText style={styles.secondaryText}>
          {I18n.get('presences-history-eventcard-reason', { reason: event.description })}
        </CaptionBoldText>
      ) : null}
    </HistoryEventCard>
  );
};
