import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import styles from './styles';
import type { StudentListItemProps } from './types';

import theme from '~/app/theme';
import { Svg } from '~/framework/components/picture';
import { BodyText } from '~/framework/components/text';
import { CallEventType, CallState } from '~/framework/modules/viescolaire/presences/model';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';

export default class StudentListItem extends React.PureComponent<StudentListItemProps> {
  constructor(props: StudentListItemProps) {
    super(props);
    this.state = {
      absentEvent: props.student.events.find(event => event.typeId === CallEventType.ABSENCE),
      lateEvent: props.student.events.find(event => event.typeId === CallEventType.LATENESS),
      leavingEvent: props.student.events.find(event => event.typeId === CallEventType.DEPARTURE),
    };
  }

  renderInfo() {
    const { student } = this.props;

    if (student.exemption_attendance)
      return <Svg name="ui-block" width={20} height={20} fill={theme.palette.status.warning.regular} />;
    if (student.lastCourseAbsent)
      return (
        <Svg
          name="ui-error-past"
          width={20}
          height={20}
          fill={theme.palette.status.failure.regular}
          style={styles.lastCourseAbsentPicture}
        />
      );
  }

  renderStatus() {
    const { callState, student } = this.props;
    const eventTypes = student.events.map(event => event.typeId);

    if (!eventTypes.length)
      return (
        <Svg
          name="ui-success_outline"
          width={32}
          height={32}
          fill={callState === CallState.DONE ? theme.palette.status.success.regular : theme.palette.grey.cloudy}
        />
      );
    if (eventTypes.includes(CallEventType.ABSENCE))
      return <Svg name="ui-error" width={32} height={32} fill={theme.palette.status.failure.regular} />;
    if (eventTypes.includes(CallEventType.LATENESS))
      return <Svg name="ui-clock-alert" width={32} height={32} fill={theme.palette.status.warning.regular} />;
    if (eventTypes.includes(CallEventType.DEPARTURE))
      return <Svg name="ui-leave" width={32} height={32} fill={theme.palette.status.warning.regular} />;
  }

  public render() {
    const { isSelected, onPress, student } = this.props;
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, isSelected && styles.containerSelected]}>
        <View style={styles.leftContainer}>
          <SingleAvatar size={48} userId={student.id} status={2} />
          <BodyText numberOfLines={1} style={styles.nameText}>
            {student.name}
          </BodyText>
          {this.renderInfo()}
        </View>
        <View style={styles.statusesContainer}>{this.renderStatus()}</View>
      </TouchableOpacity>
    );
  }
}
