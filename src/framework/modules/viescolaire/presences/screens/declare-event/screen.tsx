import * as React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import { connect } from 'react-redux';

import styles from './styles';
import type { PresencesDeclareEventScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import PrimaryButton from '~/framework/components/buttons/primary';
import DateTimePicker from '~/framework/components/dateTimePicker';
import TextInput from '~/framework/components/inputs/text';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import DropdownPicker from '~/framework/components/pickers/dropdown';
import { Svg } from '~/framework/components/picture';
import { BodyText, SmallBoldText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { getSession } from '~/framework/modules/auth/reducer';
import CallCard from '~/framework/modules/viescolaire/presences/components/call-card';
import { CallEvent, CallEventType, CallState, Course } from '~/framework/modules/viescolaire/presences/model';
import { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { presencesService } from '~/framework/modules/viescolaire/presences/service';
import { navBarOptions } from '~/framework/navigation/navBar';
import { addTime, subtractTime } from '~/framework/util/date';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';

const getNavBarTitle = (eventType: CallEventType): string => {
  switch (eventType) {
    case CallEventType.ABSENCE:
      return I18n.get('presences-declareevent-absence');
    case CallEventType.LATENESS:
      return I18n.get('presences-declareevent-lateness');
    case CallEventType.DEPARTURE:
      return I18n.get('presences-declareevent-departure');
  }
};

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.declareEvent>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: getNavBarTitle(route.params.type),
  }),
});

const getInitialDate = (course: Course, eventType: CallEventType, event?: CallEvent): Moment => {
  const now = moment();

  if (event) return eventType === CallEventType.LATENESS ? event.endDate : event.startDate;
  if (now.isSameOrAfter(course.startDate) && now.isSameOrBefore(course.endDate)) return now;
  return eventType === CallEventType.LATENESS ? addTime(course.startDate, 5, 'm') : subtractTime(course.endDate, 5, 'm');
};

const PresencesDeclareEventScreen = (props: PresencesDeclareEventScreenPrivateProps) => {
  const [isEventAlreadyExisting] = React.useState<boolean>(props.route.params.event !== undefined);
  const [date, setDate] = React.useState<Moment>(
    getInitialDate(props.route.params.course, props.route.params.type, props.route.params.event),
  );
  const [isDropdownOpen, setDropdownOpen] = React.useState<boolean>(false);
  const [reasonId, setReasonId] = React.useState<number | null>(props.route.params.event?.reasonId ?? null);
  const [comment, setComment] = React.useState<string>(props.route.params.event?.comment ?? '');
  const [isCreating, setCreating] = React.useState<boolean>(false);
  const [isDeleting, setDeleting] = React.useState<boolean>(false);

  const closeDropdown = () => setDropdownOpen(false);

  const getIsEventEdited = (): boolean => {
    const { event, type } = props.route.params;

    if (!event) return false;
    if (type === CallEventType.LATENESS && !date.isSame(event.endDate)) return true;
    if (type === CallEventType.DEPARTURE && !date.isSame(event.startDate)) return true;
    return reasonId !== event.reasonId || comment !== event.comment;
  };

  const createEvent = async () => {
    try {
      const { navigation, session } = props;
      const { callId, course, event, student, type } = props.route.params;
      const start = type === CallEventType.DEPARTURE ? date : course.startDate;
      const end = type === CallEventType.LATENESS ? date : course.endDate;

      setCreating(true);
      if (!session) throw new Error();
      const absence = student.events.find(e => e.typeId === CallEventType.ABSENCE);
      if (type !== CallEventType.ABSENCE && absence) {
        await presencesService.event.delete(session, absence.id);
      }
      if (event && event.id) {
        if (type === CallEventType.ABSENCE) {
          await presencesService.eventReason.update(
            session,
            event.id,
            student.id,
            course.structureId,
            callId,
            type,
            start,
            end,
            reasonId,
          );
        } else {
          await presencesService.event.update(session, event.id, student.id, callId, type, start, end, reasonId, comment);
        }
      } else {
        await presencesService.event.create(session, student.id, callId, type, start, end, reasonId, comment);
      }
      await presencesService.call.updateState(session, callId, CallState.IN_PROGRESS);
      navigation.goBack();
      if (isEventAlreadyExisting) Toast.showSuccess(I18n.get('presences-declareevent-eventedited'));
    } catch {
      setCreating(false);
      Toast.showError(I18n.get('presences-declareevent-error-text'));
    }
  };

  const deleteEvent = async () => {
    try {
      const { navigation, session } = props;
      const { callId, event } = props.route.params;

      setDeleting(true);
      if (!session || !event) throw new Error();
      await presencesService.event.delete(session, event.id);
      await presencesService.call.updateState(session, callId, CallState.IN_PROGRESS);
      navigation.goBack();
    } catch {
      setDeleting(false);
      Toast.showError(I18n.get('presences-declareevent-error-text'));
    }
  };

  const getStatusTexts = () => {
    const { type } = props.route.params;

    switch (type) {
      case CallEventType.ABSENCE:
        return {
          deleteActionText: I18n.get('presences-declareevent-absence-delete'),
          reasonText: I18n.get('presences-declareevent-absence-reason'),
        };
      case CallEventType.LATENESS:
        return {
          deleteActionText: I18n.get('presences-declareevent-lateness-delete'),
          reasonText: I18n.get('presences-declareevent-lateness-reason'),
          timeText: I18n.get('presences-declareevent-lateness-time'),
        };
      case CallEventType.DEPARTURE:
        return {
          deleteActionText: I18n.get('presences-declareevent-departure-delete'),
          reasonText: I18n.get('presences-declareevent-departure-reason'),
          timeText: I18n.get('presences-declareevent-departure-time'),
        };
    }
  };

  const renderHeading = () => {
    const { student, type } = props.route.params;
    const color = type === CallEventType.ABSENCE ? theme.palette.status.failure.regular : theme.palette.status.warning.regular;
    const iconName = type === CallEventType.ABSENCE ? 'ui-error' : type === CallEventType.LATENESS ? 'ui-clock-alert' : 'ui-leave';

    return (
      <View style={styles.headingContainer}>
        <View style={styles.headingNameContainer}>
          <SingleAvatar size={48} userId={student.id} status={2} />
          <BodyText numberOfLines={1} style={[styles.headingNameText, { color }]}>
            {student.name}
          </BodyText>
        </View>
        <Svg name={iconName} width={32} height={32} fill={color} />
      </View>
    );
  };

  const renderPage = () => {
    const { course, reasons, type } = props.route.params;
    const { deleteActionText, reasonText, timeText } = getStatusTexts();

    return (
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.container}>
        {renderHeading()}
        <CallCard course={course} disabled />
        {type !== CallEventType.ABSENCE ? (
          <View style={styles.fieldContainer}>
            <SmallBoldText>{timeText}</SmallBoldText>
            <DateTimePicker
              mode="time"
              value={date}
              onChangeValue={value => setDate(value)}
              minimumDate={course.startDate}
              maximumDate={course.endDate}
              style={styles.timePickerContainer}
            />
          </View>
        ) : null}
        {isDropdownOpen ? <Pressable onPress={closeDropdown} style={styles.backdropContainer} /> : null}
        {(type === CallEventType.ABSENCE || type === CallEventType.LATENESS) && reasons.length ? (
          <Pressable onPress={closeDropdown} style={styles.fieldContainer}>
            <SmallBoldText>{reasonText}</SmallBoldText>
            <DropdownPicker
              open={isDropdownOpen}
              value={reasonId ?? 0}
              items={[
                { label: I18n.get('presences-declareevent-withoutreason'), value: 0 },
                ...reasons.map(r => ({
                  label: r.label,
                  value: r.id,
                })),
              ]}
              setOpen={setDropdownOpen}
              setValue={value => setReasonId(value || null)}
            />
          </Pressable>
        ) : null}
        {type === CallEventType.DEPARTURE ? (
          <View style={styles.fieldContainer}>
            <SmallBoldText>{reasonText}</SmallBoldText>
            <TextInput
              placeholder={I18n.get('presences-declareevent-textinput-placeholder')}
              value={comment}
              onChangeText={text => setComment(text)}
            />
          </View>
        ) : null}
        <PrimaryButton
          text={I18n.get(isEventAlreadyExisting ? 'presences-declareevent-edit' : 'presences-declareevent-validate')}
          iconLeft="ui-check"
          action={createEvent}
          disabled={type !== CallEventType.ABSENCE && (date.isBefore(course.startDate) || date.isAfter(course.endDate))}
          loading={isCreating}
          style={styles.primaryActionContainer}
        />
        {isEventAlreadyExisting ? (
          <DefaultButton
            text={deleteActionText}
            iconLeft="ui-delete"
            contentColor={theme.palette.status.failure.regular}
            action={deleteEvent}
            loading={isDeleting}
            style={styles.deleteActionContainer}
          />
        ) : null}
      </ScrollView>
    );
  };

  const isEventEdited = getIsEventEdited();

  usePreventBack({
    showAlert: isEventEdited && !isCreating && !isDeleting,
    text: I18n.get('presences-declareevent-confirmation-unsavedmodification-text'),
    title: I18n.get('presences-declareevent-confirmation-unsavedmodification-title'),
  });

  const PageComponent = Platform.select<typeof KeyboardPageView | typeof PageView>({ android: PageView, ios: KeyboardPageView })!;

  return <PageComponent style={styles.pageContainer}>{renderPage()}</PageComponent>;
};

export default connect((state: IGlobalState) => {
  const session = getSession();

  return {
    session,
  };
})(PresencesDeclareEventScreen);
