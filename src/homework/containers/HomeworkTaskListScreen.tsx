import * as React from 'react';
import { NavigationFocusInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';

import { getUserSession } from '~/framework/util/session';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { fetchHomeworkTasks } from '~/homework/actions/tasks';
import {
  HomeworkTaskListScreen,
  IHomeworkTaskListScreenDataProps,
  IHomeworkTaskListScreenEventProps,
  IHomeworkTaskListScreenProps,
} from '~/homework/components/HomeworkTaskListScreen';
import config from '../config';

const mapStateToProps: (state: any) => IHomeworkTaskListScreenDataProps = state => {
  // Extract data from state
  const session = getUserSession(state);
  const localState = state.homework;
  const selectedDiaryId = localState.selectedDiary;
  const currentDiaryTasks = localState.tasks[selectedDiaryId];
  const diaryListData = localState.diaryList.data;
  const diaryInformation = diaryListData[selectedDiaryId];
  if (!selectedDiaryId || !currentDiaryTasks)
    if (localState.diaryList.didInvalidate)
      return {
        /* Initial props if there is not initialisation yet.
        For the hack, we consider app is already fetching to avoid a screen blinking. */
        diaryId: undefined,
        didInvalidate: true,
        isFetching: true,
        lastUpdated: undefined,
        tasksByDay: undefined,
        session,
      };
    else {
      return {
        /* Here is an empty screen displayer */
        diaryId: undefined,
        didInvalidate: true,
        isFetching: false,
        lastUpdated: undefined,
        tasksByDay: undefined,
        session,
      };
    }
  const { didInvalidate, isFetching, lastUpdated } = currentDiaryTasks;

  // Flatten two-dimensional IOrderedArrayById
  const tasksByDay = currentDiaryTasks.data.ids.map(diaryId => ({
    date: currentDiaryTasks.data.byId[diaryId].date,
    id: diaryId,
    tasks: currentDiaryTasks.data.byId[diaryId].tasks.ids.map(taskId => currentDiaryTasks.data.byId[diaryId].tasks.byId[taskId]),
  }));

  // Format props
  return {
    diaryId: selectedDiaryId,
    didInvalidate,
    isFetching,
    lastUpdated,
    tasksByDay,
    diaryListData,
    diaryInformation,
    session,
  };
};

const mapDispatchToProps: (dispatch: any) => IHomeworkTaskListScreenEventProps = dispatch => {
  return {
    dispatch,
    onRefresh: diaryId => {
      dispatch(fetchHomeworkTasks(diaryId));
    },
  };
};

class HomeworkTaskListScreenContainer extends React.PureComponent<
  IHomeworkTaskListScreenProps & NavigationFocusInjectedProps & { dispatch: any },
  object
> {
  render() {
    return <HomeworkTaskListScreen {...this.props} />;
  }
}

const HomeworkTaskListScreenContainerConnected = connect(mapStateToProps, mapDispatchToProps)(HomeworkTaskListScreenContainer);

export default withViewTracking(`${config.name}/tasks`)(HomeworkTaskListScreenContainerConnected);
