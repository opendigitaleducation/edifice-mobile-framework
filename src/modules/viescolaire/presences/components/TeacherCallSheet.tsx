import I18n from 'i18n-js';
import moment from 'moment';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '~/framework/components/picture/Icon';
import { Text, TextBold } from '~/framework/components/text';
import { ICourse } from '~/modules/viescolaire/presences/containers/TeacherCallList';
import { IClassesCall } from '~/modules/viescolaire/presences/state/TeacherClassesCall';
import { LeftColoredItem } from '~/modules/viescolaire/viesco/components/Item';
import ButtonOk from '~/ui/ConfirmDialog/buttonOk';
import { PageContainer } from '~/ui/ContainerContent';

import StudentRow from './StudentRow';

import StudentRow from './StudentRow';

const style = StyleSheet.create({
  validateButton: {
    alignSelf: 'center',
    width: '40%',
    margin: 20,
  },
  classesView: { justifyContent: 'flex-end', flexDirection: 'row', paddingBottom: 15 },
  topItem: { justifyContent: 'flex-end', flexDirection: 'row' },
});

type MoveToFolderModalState = {
  refreshing: boolean;
  callData: IClassesCall;
  fetching: boolean;
  course: ICourse;
  isScrolling: boolean;
};

export default class CallSheet extends React.PureComponent<any, MoveToFolderModalState> {
  constructor(props) {
    super(props);

    const { courseInfos } = this.props.navigation.state.params;
    const { callList } = props;
    this.state = {
      refreshing: false,
      callData: callList.data,
      fetching: callList.isFetching,
      course: courseInfos,
      isScrolling: false,
    };
  }

  componentDidMount() {
    const { registerId } = this.props.course;
    if (registerId !== null && registerId !== undefined) this.props.getClasses(registerId);
  }

  componentDidUpdate(prevProps) {
    const { registerId } = this.props.course;
    if (prevProps.course.registerId !== registerId) this.props.getClasses(registerId);
    const { callList } = this.props;
    const fetching = callList.isFetching;
    this.setState({
      callData: callList.data,
      fetching,
      refreshing: fetching,
    });
  }

  onRefreshStudentsList = () => {
    const { registerId } = this.props.course;
    this.setState({ refreshing: true });
    this.props.getClasses(registerId);
  };

  private StudentsList() {
    const { students } = this.state.callData;
    const studentsList = students.sort((a, b) => a.name.localeCompare(b.name));
    const { registerId } = this.props.course;
    const { postAbsentEvent, deleteEvent, navigation } = this.props;
    return (
      <>
        {studentsList.length > 0 ? (
          <ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefreshStudentsList} />}>
            {studentsList.map(student => (
              <StudentRow
                student={student}
                mementoNavigation={() => this.props.navigation.navigate('Memento', { studentId: student.id })}
                lateCallback={event =>
                  this.props.navigation.navigate('DeclareEvent', {
                    type: 'late',
                    registerId,
                    student,
                    startDate: this.state.callData.start_date,
                    endDate: this.state.callData.end_date,
                    event,
                  })
                }
                leavingCallback={event =>
                  this.props.navigation.navigate('DeclareEvent', {
                    type: 'leaving',
                    registerId,
                    student,
                    startDate: this.state.callData.start_date,
                    endDate: this.state.callData.end_date,
                    event,
                  })
                }
                checkAbsent={() => {
                  postAbsentEvent(
                    student.id,
                    registerId,
                    moment(this.state.callData.start_date),
                    moment(this.state.callData.end_date),
                  );
                }}
                uncheckAbsent={event => {
                  deleteEvent(event);
                }}
              />
            ))}
            <View style={style.validateButton}>
              <ButtonOk
                label={I18n.t('viesco-validate')}
                onPress={() => {
                  this.props.validateRegister(registerId);
                  navigation.goBack(null);
                }}
              />
            </View>
          </ScrollView>
        ) : null}
      </>
    );
  }

  private ClassesInfos() {
    return (
      <View style={style.classesView}>
        <LeftColoredItem shadow style={style.topItem} color="#FFB600">
          <Text>
            {moment(this.state.callData.start_date).format('LT')} - {moment(this.state.callData.end_date).format('LT')}
          </Text>
          {this.state.course.classroom !== '' && (
            <Text>
              &emsp;
              <Icon name="pin_drop" size={18} />
              {I18n.t('viesco-room')} {this.state.course.classroom}
            </Text>
          )}
          <TextBold>&emsp;{this.state.course.grade}</TextBold>
        </LeftColoredItem>
      </View>
    );
  }

  renderCall = () => {
    return (
      <>
        {this.ClassesInfos()}
        {this.StudentsList()}
      </>
    );
  };

  public render() {
    return <PageContainer>{this.state.callData.course_id !== undefined ? this.renderCall() : null}</PageContainer>;
  }
}
