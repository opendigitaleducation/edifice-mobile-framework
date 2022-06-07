import I18n from 'i18n-js';
import moment from 'moment';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PageView } from '~/framework/components/page';
import { Icon } from '~/framework/components/picture/Icon';
import { Text, TextBold, TextSizeStyle, remStyle } from '~/framework/components/text';
import {
  deleteEvent,
  postLateEvent,
  postLeavingEvent,
  updateLateEvent,
  updateLeavingEvent,
} from '~/modules/viescolaire/presences/actions/events';
import { LeftColoredItem } from '~/modules/viescolaire/viesco/components/Item';
import ButtonOk from '~/ui/ConfirmDialog/buttonOk';
import DateTimePicker from '~/ui/DateTimePicker';

const style = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  recapHeader: {
    marginTop: 10,
    paddingVertical: 12,
    alignSelf: 'flex-end',
    width: '90%',
    marginBottom: 15,
  },
  recapHeaderView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recapHeaderText: {
    marginHorizontal: 5,
  },
  underlinedText: {
    alignSelf: 'center',
    borderBottomWidth: 2,
    padding: 10,
  },
  inputContainer: {
    marginHorizontal: 30,
  },
  timeView: {
    margin: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 3,
    backgroundColor: 'white',
  },
  timeViewText: {
    ...remStyle(55 / 14),
    paddingVertical: 50,
    textDecorationLine: 'underline',
  },
  labelText: {
    ...TextSizeStyle.Small,
  },
  buttonOkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    marginVertical: 20,
  },
});

type DeclarationState = {
  date: Date;
  reason: string;
};

type DeclarationProps = {
  declareLateness: any;
  updateLateness: any;
  declareLeaving: any;
  updateLeaving: any;
  deleteEvent: any;
} & NavigationInjectedProps<any>;

export class DeclareEvent extends React.PureComponent<DeclarationProps, DeclarationState> {
  constructor(props) {
    super(props);
    const { event } = props.navigation.state.params;
    if (event === undefined) {
      this.state = {
        date: new Date(),
        reason: '',
      };
    } else {
      if (event.type_id === 2) this.state = { date: moment(event.end_date).toDate(), reason: event.comment };
      else if (event.type_id === 3) this.state = { date: moment(event.start_date).toDate(), reason: event.comment };
    }
  }

  componentDidMount() {
    const properties = this.getSpecificProperties(this.props.navigation.state.params.type);
    this.props.navigation.setParams({
      title: properties.title,
      color: properties.mainColor,
    });
  }

  onTimeChange = selectedDate => {
    const { date } = this.state;
    const currentDate = selectedDate || date;
    this.setState({
      date: currentDate,
    });
  };

  onReasonChange = value => {
    this.setState({
      reason: value,
    });
  };

  onSubmit = () => {
    const { date, reason } = this.state;
    const { declareLateness, declareLeaving, updateLateness, updateLeaving } = this.props;
    const { type, student, event, registerId, startDate, endDate } = this.props.navigation.state.params;
    const momentDate = moment(date).second(0);
    const startDateMoment = moment(startDate).second(0);
    const endDateMoment = moment(endDate).second(0);
    if (type === 'late') {
      if (event === undefined) {
        // deleting absence when lateness is declared
        const absence = student.events.find(i => i.type_id === 1);
        if (absence !== undefined) this.props.deleteEvent(absence);
        declareLateness(student.id, momentDate, reason, registerId, startDateMoment);
      } else {
        updateLateness(student.id, momentDate, reason, event.id, registerId, startDateMoment);
      }
    } else if (type === 'leaving') {
      if (event === undefined) {
        declareLeaving(student.id, momentDate, reason, registerId, endDateMoment);
      } else {
        updateLeaving(student.id, momentDate, reason, event.id, registerId, endDateMoment);
      }
    }
    this.props.navigation.goBack();
  };

  onCancel = () => {
    const { event, student } = this.props.navigation.state.params;
    this.props.deleteEvent({ ...event, student_id: student.id });
    this.props.navigation.goBack();
  };

  getSpecificProperties(type) {
    const result = {
      mainColor: '',
      lightColor: '',
      mainText: '',
      inputLabel: '',
      title: '',
    };
    switch (type) {
      case 'late':
        result.mainColor = '#9c2cb4';
        result.lightColor = 'rgb(179, 0, 179)';
        result.title = I18n.t('viesco-lateness');
        result.mainText = I18n.t('viesco-arrived');
        result.inputLabel = I18n.t('viesco-arrived-motive');
        break;
      case 'leaving':
        result.mainColor = '#ed9ffd';
        result.lightColor = '#ed9ffd';
        result.title = I18n.t('viesco-leaving');
        result.mainText = I18n.t('viesco-left');
        result.inputLabel = I18n.t('viesco-left-motive');
        break;
    }
    return result;
  }

  public render() {
    const { date } = this.state;
    const { type, event, student, startDate, endDate } = this.props.navigation.state.params;
    const { mainColor, lightColor, mainText, inputLabel } = this.getSpecificProperties(type);
    const startDateString = moment(startDate).format('H:mm');
    const endDateString = moment(endDate).format('H:mm');

    const navBarInfo = {
      title: this.props.navigation.getParam('title'),
      style: {
        backgroundColor: this.props.navigation.getParam('color'),
      },
    };

    return (
      <PageView navigation={this.props.navigation} navBarWithBack={navBarInfo}>
        <KeyboardAvoidingView
          enabled={Platform.OS === 'ios'}
          behavior="padding"
          keyboardVerticalOffset={60}
          style={style.safeAreaContainer}>
          <ScrollView>
            <LeftColoredItem color={mainColor} style={style.recapHeader}>
              <View style={style.recapHeaderView}>
                <Icon color="grey" size={12} name="access_time" />
                <Text style={style.recapHeaderText}>
                  {startDateString} - {endDateString}
                </Text>
                <TextBold>{student.name}</TextBold>
              </View>
            </LeftColoredItem>
            <Text style={[style.underlinedText, { borderBottomColor: mainColor, color: mainColor }]}>{mainText}</Text>
            <DateTimePicker
              value={moment(date)}
              mode="time"
              onChange={this.onTimeChange}
              renderDate={dateItem => (
                <View style={[style.timeView, { borderColor: lightColor }]}>
                  <Text style={style.timeViewText}>{dateItem.format('HH : mm')}</Text>
                </View>
              )}
            />
            <View style={style.inputContainer}>
              <Text style={style.labelText}>{inputLabel}</Text>
              <TextInput
                defaultValue={event === undefined ? '' : event.comment}
                placeholder={I18n.t('viesco-enter-text')}
                underlineColorAndroid="lightgrey"
                onChangeText={this.onReasonChange}
              />
            </View>
            <View style={style.buttonOkContainer}>
              {event !== undefined && <ButtonOk label={I18n.t('delete')} onPress={this.onCancel} />}
              <ButtonOk
                disabled={moment(this.state.date).isBefore(startDate) || moment(this.state.date).isAfter(endDate)}
                label={I18n.t('viesco-confirm')}
                onPress={this.onSubmit}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </PageView>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      declareLateness: postLateEvent,
      updateLateness: updateLateEvent,
      declareLeaving: postLeavingEvent,
      updateLeaving: updateLeavingEvent,
      deleteEvent,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(DeclareEvent);
