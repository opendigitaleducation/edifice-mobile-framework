/**
 * DiaryPage
 *
 * Display page for all homework in a calendar-like way.
 */

// imports ----------------------------------------------------------------------------------------

import style from "glamorous-native";
import * as React from "react";
import { RefreshControl } from "react-native";
const { View, Text, FlatList, TouchableOpacity } = style;
import { connect } from "react-redux";

import { CommonStyles } from "../../styles/common/styles";
import { PageContainer } from "../../ui/ContainerContent";
import { AppTitle, Header } from "../../ui/headers/Header";

import moment from "moment";
// tslint:disable-next-line:no-submodule-imports
import "moment/locale/fr";
moment.locale("fr");

import { fetchDiaryList, fetchDiaryListIfNeeded } from "../actions/list";
import { diaryTaskSelected } from "../actions/selectedTask";
import { fetchDiaryTasks, fetchDiaryTasksIfNeeded } from "../actions/tasks";

import { IDiaryDay, IDiaryTask, IDiaryTasks } from "../reducers/tasks";

import HTMLAdaptor from "../../infra/HTMLAdaptor";
import today from "../../utils/today";

import I18n from "react-native-i18n";

// Header component -------------------------------------------------------------------------------

// TODO : the header must show the month and the year instead of "Homework".

// tslint:disable-next-line:max-classes-per-file
export class DiaryPageHeader extends React.Component<
  { navigation?: any },
  undefined
> {
  public render() {
    return (
      <Header>
        <AppTitle>{I18n.t("Diary")}</AppTitle>
      </Header>
    );
  }
}

// Main component ---------------------------------------------------------------------------------

interface IDiaryPageProps {
  navigation?: any;
  didInvalidate?: boolean;
  dispatch?: any; // given by connect()
  isFetching?: boolean;
  lastUpdated?: Date;
  diaryId?: string; // selected diaryId
  diaryTasksByDay?: Array<{
    id: string;
    date: moment.Moment;
    tasks: IDiaryTask[];
  }>; // for this diaryId, all the tasks by day
}

/**
 * DiaryPage
 *
 * The main component.
 */
// tslint:disable-next-line:max-classes-per-file
class DiaryPage_Unconnected extends React.Component<IDiaryPageProps, {}> {
  private flatList: FlatList<IDiaryTasks>; // react-native FlatList component ref // FIXME typescript error (but js works fine). Why ?
  private setFlatListRef: any; // FlatList setter, executed when this component is mounted.

  constructor(props) {
    super(props);

    // Refs
    this.flatList = null;
    this.setFlatListRef = element => {
      this.flatList = element;
    };
  }

  // render & lifecycle

  public render() {
    // console.warn(this.props);
    return (
      <PageContainer>
        <DiaryTimeLine />
        <FlatList
          innerRef={this.setFlatListRef}
          data={this.props.diaryTasksByDay}
          renderItem={({ item }) => (
            <DiaryDayTasks data={item} navigation={this.props.navigation} />
          )}
          keyExtractor={item => item.date.format("YYYY-MM-DD")}
          ListHeaderComponent={() => <View height={15} />}
          refreshControl={
            <RefreshControl
              refreshing={this.props.isFetching}
              onRefresh={() => this.forceFetchDiaryTasks()}
            />
          }
        />
      </PageContainer>
    );
  }

  public componentDidMount() {
    this.fetchDiaryList();
  }

  public fetchDiaryList() {
    this.props.dispatch(fetchDiaryListIfNeeded());
  }

  public fetchDiaryTasks() {
    this.props.dispatch(fetchDiaryTasksIfNeeded(this.props.diaryId));
  }

  public forceFetchDiaryTasks() {
    this.props.dispatch(fetchDiaryTasks(this.props.diaryId));
  }
}

export const DiaryPage = connect((state: any) => {
  // Map State To Props
  const localState = state.diary;
  // console.warn(localState);
  const selectedDiaryId = localState.selected;
  const currentDiaryTasks = localState.tasks[selectedDiaryId];
  if (!currentDiaryTasks)
    return {
      diaryId: null,
      diaryTasksByDay: null,
      didInvalidate: true,
      isFetching: false,
      lastUpdated: null
    };
  const { didInvalidate, isFetching, lastUpdated } = currentDiaryTasks;
  // console.warn(currentDiaryTasks.data);

  // Flatten two-dimensional IOrderedArrayById
  const diaryTasksByDay = currentDiaryTasks.data.ids.map(diaryId => ({
    date: currentDiaryTasks.data.byId[diaryId].date,
    id: diaryId,
    tasks: currentDiaryTasks.data.byId[diaryId].tasks.ids.map(
      taskId => currentDiaryTasks.data.byId[diaryId].tasks.byId[taskId]
    )
  }));

  // console.warn(diaryTasksByDay);
  /*
  const { didInvalidate, isFetching, lastUpdated } = localState.list;
  const diaryList = localState.list.data ? localState.list.data : {}; // list.data may be undefined when no reducer has been run yet.
  const selectedDiaryId = localState.selected;
  const currentDiary = diaryList[selectedDiaryId];
  let diaryId = null;
  let diaryTasksByDay: IDiaryTasks = { byId: {}, ids: [] }; // start with an empty one.

  if (currentDiary) {
    diaryId = currentDiary.id;
    diaryTasksByDay = currentDiary.tasksByDay; // TODO get tasks from state -> diary -> tasks to display them.
  }*/

  return {
    diaryId: selectedDiaryId,
    diaryTasksByDay,
    didInvalidate,
    isFetching,
    lastUpdated
  };
})(DiaryPage_Unconnected);

// Functional components --------------------------------------------------------------------------

/**
 * DiaryDayTasks
 *
 * Display the task list of a day (with day number and name).
 * Props:
 *     data: DiaryDay - information of the day (number and name) and list of the tasks.
 */
interface IDiaryDayTasksProps {
  data: IDiaryDay;
  navigation?: any;
  dispatch?: any;
  selectedDiary?: string;
}
// tslint:disable-next-line:max-classes-per-file
class DiaryDayTasks_Unconnected extends React.Component<
  IDiaryDayTasksProps,
  any
> {
  constructor(props: IDiaryDayTasksProps) {
    super(props);
  }

  public render() {
    const tasksAsArray = Object.values(this.props.data.tasks);
    return (
      <View>
        <DiaryDayCheckpoint
          nb={this.props.data.date.date()}
          text={this.props.data.date.format("dddd")}
          active={this.props.data.date.isSame(today(), "day")}
        />
        {tasksAsArray.map(item => (
          <DiaryCard
            title={item.title}
            content={item.content}
            key={item.id}
            onPress={() => {
              this.props.dispatch(
                diaryTaskSelected(
                  this.props.selectedDiary,
                  this.props.data.date,
                  item.id
                )
              );
              const navigation = this.props.navigation;
              navigation.navigate("DiaryTask");
            }}
          />
        ))}
      </View>
    );
  }
}

export const DiaryDayTasks = connect((state: any) => {
  const ret: {
    selectedDiary: string;
  } = {
    selectedDiary: state.diary.selected
  };
  return ret;
})(DiaryDayTasks_Unconnected); // FIXME : it works but what the fuck with typescript ???

// Pure display components ------------------------------------------------------------------------

/**
 * Just display a grey vertical line at the left tall as the screen is.
 */
const DiaryTimeLine = style.view({
  backgroundColor: CommonStyles.entryfieldBorder, // TODO: Use the linear gradient instead of a plain grey
  height: "100%",
  left: 29,
  position: "absolute",
  width: 1
});

/**
 * DiaryDayCheckpoint
 *
 * Just a wrapper for the heading of a day tasks. Displays a day number in a circle and a day name
 * TODO?: May took a Date object as a parameter instead of a number and a string ?
 * Props:
 *     `style`: `any` - Glamorous style to add.
 * 	   `nb`: `number`- Day number to be displayed in a `DiaryDayCircleNumber`.
 *     `text`: `string` - Day name to be displayed.
 *     `active`: `boolean` - An active `DiaryDayCheckpoint` will be highlighted. Default `false`.
 *
 * An unstyled version on this component is available as `DiaryDayCheckpoint_Unstyled`.
 */

// tslint:disable-next-line:variable-name
const DiaryDayCheckpoint_Unstyled = ({
  style,
  nb,
  text = "",
  active = false
}: {
  style?: any;
  nb?: number;
  text?: string;
  active?: boolean;
}) => (
  <View style={[style]}>
    <DiaryDayCircleNumber nb={nb} active={active} />
    <Text color={CommonStyles.lightTextColor} fontSize={12}>
      {text.toUpperCase()}
    </Text>
  </View>
);

const DiaryDayCheckpoint = style(DiaryDayCheckpoint_Unstyled)({
  alignItems: "center",
  flexDirection: "row"
});

/**
 * DiaryDayCircleNumber
 *
 * Display a number in a circle elegantly. Mostly used to show a day number.
 * Props:
 *     `style`: `any` - Glamorous style to add.
 * 	   `nb`: `number` - Just as simple as the number to be displayed.
 *     `active`: `boolean` - An active `DiaryDayCircleNumber` will be highlighted.
 * TODO: When active, the blue background should be a gradient, according to the mockup.
 *
 * An unstyled version on this component is available as `DiaryDayCircleNumber_Unstyled`.
 */
// tslint:disable-next-line:variable-name
const DiaryDayCircleNumber_Unstyled = ({
  style,
  nb,
  active = false
}: {
  style?: any;
  nb?: number;
  active?: boolean;
}) => (
  <View style={[style]}>
    <Text
      color={active ? CommonStyles.tabBottomColor : CommonStyles.lightTextColor}
      fontSize={12}
    >
      {nb}
    </Text>
  </View>
);

const DiaryDayCircleNumber = style(DiaryDayCircleNumber_Unstyled)(
  {
    alignItems: "center",
    borderColor: CommonStyles.tabBottomColor,
    borderRadius: 15,
    borderStyle: "solid",
    borderWidth: 1,
    elevation: 3,
    height: 30,
    justifyContent: "center",
    marginHorizontal: 14,
    shadowColor: "#6B7C93",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 30
  },
  ({ active }) => ({
    backgroundColor: active
      ? CommonStyles.actionColor
      : CommonStyles.tabBottomColor
  })
);

/**
 * DiaryCard
 *
 * Like `Card`, but some margin and padding, custom shadow and rounded.
 *
 * An unstyled version on this component is available as `DiaryCard_Unstyled`.
 */

// tslint:disable-next-line:variable-name
const DiaryCard_Unstyled = ({
  style,
  title,
  content,
  onPress
}: {
  style?: any;
  title?: string;
  content?: string;
  onPress?: any; // custom event
}) => (
  <TouchableOpacity
    style={[style]}
    onPress={() => {
      onPress();
    }}
  >
    <Text fontSize={14} color={CommonStyles.textColor} lineHeight={20}>
      {HTMLAdaptor(content).extractTextBeginning()}
    </Text>
    <Text fontSize={12} color={CommonStyles.lightTextColor} marginTop={5}>
      {title}
    </Text>
  </TouchableOpacity>
);

const DiaryCard = style(DiaryCard_Unstyled)({
  backgroundColor: "#FFF",
  borderRadius: 5,
  elevation: 1,
  marginBottom: 15,
  marginLeft: 60,
  marginRight: 20,
  paddingHorizontal: 15,
  paddingVertical: 20,
  shadowColor: "#6B7C93",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2
});
