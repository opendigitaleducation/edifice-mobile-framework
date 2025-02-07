import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import moment, { Moment } from 'moment';

import styles from './styles';
import type { CallCardProps, CallCardStyle } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { BodyText, HeadingSText, NestedText } from '~/framework/components/text';
import { CallState } from '~/framework/modules/viescolaire/presences/model';
import appConf from '~/framework/util/appConf';

export default class CallCard extends React.PureComponent<CallCardProps> {
  private getStatusStyle(): CallCardStyle {
    const { course, showStatus } = this.props;
    const now = moment();
    const isValidated = course.callStateId === CallState.DONE;

    if (!showStatus) {
      return {
        borderColor: theme.palette.grey.graphite,
        borderWidth: UI_SIZES.border.thin,
        textColor: theme.ui.text.regular,
      };
    }
    if (now.isAfter(course.endDate)) {
      return {
        borderColor: isValidated ? theme.palette.status.success.pale : theme.palette.status.warning.pale,
        borderWidth: UI_SIZES.border.thin,
        status: {
          backgroundColor: isValidated ? theme.palette.status.success.pale : theme.palette.status.warning.pale,
          iconColor: isValidated ? theme.palette.status.success.regular : theme.palette.status.warning.regular,
          iconName: isValidated ? 'ui-forgoing-check' : 'ui-forgoing-error',
        },
        textColor: theme.ui.text.regular,
      };
    } else if (now.isBetween(course.startDate, course.endDate) || course.callStateId === CallState.DONE) {
      return {
        borderColor: isValidated ? theme.palette.status.success.regular : theme.palette.status.info.regular,
        borderWidth: UI_SIZES.border.small,
        status: {
          backgroundColor: isValidated ? theme.palette.status.success.pale : theme.palette.status.info.pale,
          iconColor: isValidated ? theme.palette.status.success.regular : theme.palette.status.info.regular,
          iconName: isValidated ? 'ui-check' : 'presences',
        },
        textColor: theme.ui.text.regular,
      };
    }
    return {
      borderColor: theme.palette.grey.pearl,
      borderWidth: UI_SIZES.border.thin,
      status: {
        backgroundColor: theme.palette.grey.pearl,
        iconColor: theme.palette.grey.graphite,
        iconName: 'ui-upcoming',
      },
      textColor: theme.ui.text.light,
    };
  }

  private getHoursLabel(startDate: Moment, endDate: Moment): string {
    if (appConf.is1d) {
      return I18n.get(startDate.get('h') < 12 ? 'presences-calllist-callcard-morning' : 'presences-calllist-callcard-afternoon');
    } else {
      return `${startDate.format('LT')} - ${endDate.format('LT')}`;
    }
  }

  public render() {
    const { course, disabled, onPress, showStatus } = this.props;
    const hoursLabel = this.getHoursLabel(course.startDate, course.endDate);
    const roomLabel = course.roomLabels[0];
    const classLabel = course.classes.length ? course.classes : course.groups;
    const { borderColor, borderWidth, status, textColor } = this.getStatusStyle();

    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.container, { borderColor, borderWidth }]}>
        <View style={styles.leftContainer}>
          <View style={styles.rowContainer}>
            <Svg name="ui-clock" width={22} height={22} fill={textColor} />
            <BodyText numberOfLines={1} style={[UI_STYLES.flexShrink1, { color: textColor }]}>
              {appConf.is1d ? classLabel : hoursLabel}
              {roomLabel ? <NestedText style={styles.roomText}>{`  -  ${roomLabel}`}</NestedText> : null}
            </BodyText>
          </View>
          <HeadingSText numberOfLines={1} style={{ color: textColor }}>
            {appConf.is1d ? hoursLabel : classLabel}
          </HeadingSText>
        </View>
        {showStatus ? (
          <View style={[styles.statusContainer, { backgroundColor: status!.backgroundColor }]}>
            <Svg name={status!.iconName} width={32} height={32} fill={status!.iconColor} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }
}
