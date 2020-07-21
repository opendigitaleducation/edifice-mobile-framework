import I18n from "i18n-js";
import moment from "moment";
import * as React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { NavigationActions } from "react-navigation";

//import I18n from "../../../infra/i18n";
import { Icon } from "../../../ui";
import TouchableOpacity from "../../../ui/CustomTouchableOpacity";
import { EmptyScreen } from "../../../ui/EmptyScreen";
import { Text, TextBold } from "../../../ui/text";
import { HomeworkItem } from "../../cdt/components/homework";
import { DenseDevoirList } from "../../competences/components/Item";
import ChildPicker from "../containers/ChildPicker";

const style = StyleSheet.create({
  dashboardPart: { paddingVertical: 8, paddingHorizontal: 15 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridButtonContainer: {
    width: "50%",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gridButton: {
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  gridButtonText: {
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  title: { fontSize: 18 },
  subtitle: { color: "#AFAFAF" },
});

type DashboardProps = {
  children: any[];
  homeworks: any[];
  evaluations: any[];
  selectChild: (child) => void;
};

const IconButton = ({ icon, color, text, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[style.gridButton, { backgroundColor: color }]}>
      <Icon size={20} color="white" name={icon} />
      <TextBold style={style.gridButtonText}>{text}</TextBold>
    </TouchableOpacity>
  );
};

export default class Dashboard extends React.PureComponent<any & DashboardProps> {
  getSubjectName = subjectId => {
    const subjectsList = this.props.subjects.data;
    const result = subjectsList.find(subject => subject.subjectId === subjectId);
    if (typeof result === "undefined") return "";
    return result.subjectLabel;
  };

  isHomeworkDone = homework => {
    if (homework.progress === null) return false;
    return homework.progress.state_label === "done";
  };

  private renderNavigationGrid() {
    return (
      <View style={[style.dashboardPart, style.grid]}>
        <View style={style.gridButtonContainer}>
          <IconButton
            onPress={() =>
              this.props.navigation.navigate(
                "presences",
                {},
                NavigationActions.navigate({
                  routeName: "History",
                  params: {
                    user_type: "Relative",
                  },
                })
              )
            }
            text={I18n.t("viesco-history")}
            color="#FCB602"
            icon="access_time"
          />
        </View>
        <View style={style.gridButtonContainer}>
          <IconButton onPress={() => true} text={I18n.t("viesco-timetable")} color="#162EAE" icon="reservation" />
        </View>
        <View style={style.gridButtonContainer}>
          <IconButton
            onPress={() => this.props.navigation.navigate("HomeworkList", { user_type: "Relative" })}
            text={I18n.t("Homework")}
            color="#2BAB6F"
            icon="check-1"
          />
        </View>
        <View style={style.gridButtonContainer}>
          <IconButton
            onPress={() => this.props.navigation.navigate("EvaluationList")}
            text={I18n.t("viesco-tests")}
            color="#F95303"
            icon="stats-bars"
          />
        </View>
      </View>
    );
  }

  private renderHomework(homeworks) {
    const tomorrowHomeworks = Object.values(homeworks.data).filter(hmk =>
      hmk.due_date.isSame(moment().add(1, "day"), "day")
    );
    return (
      <View style={style.dashboardPart}>
        <TextBold style={style.title}>{I18n.t("viesco-homework")}</TextBold>
        <Text style={style.subtitle}>{I18n.t("viesco-homework-fortomorrow")}</Text>
        {tomorrowHomeworks.length === 0 && (
          <EmptyScreen
            imageSrc={require("../../../../assets/images/empty-screen/empty-homework.png")}
            imgWidth={64}
            imgHeight={64}
            title={I18n.t("viesco-homework-EmptyScreenText")}
          />
        )}
        {tomorrowHomeworks.map(homework => (
          <HomeworkItem
            disabled
            checked={homework.progress && homework.progress.state_id === 2}
            title={this.getSubjectName(homework.subject_id)}
            subtitle={homework.type}
          />
        ))}
      </View>
    );
  }

  private renderLastEval(evaluations) {
    // return (
    //   <View style={style.dashboardPart}>
    //     <TextBold style={style.title}>{I18n.t("viesco-lasteval")}</TextBold>
    //     <DenseDevoirList devoirs={evaluations} />
    //   </View>
    // );
    return (
      <View style={style.dashboardPart}>
        <TextBold style={style.title}>{I18n.t("viesco-lasteval")}</TextBold>
        <EmptyScreen
          imageSrc={require("../../../../assets/images/empty-screen/empty-evaluations.png")}
          imgWidth={64}
          imgHeight={64}
          title={I18n.t("viesco-eval-EmptyScreenText")}
        />
      </View>
    );
  }

  public render() {
    const { homeworks, evaluations } = this.props;

    return (
      <View style={{ flex: 1 }}>
        <ChildPicker />
        {this.renderNavigationGrid()}
        <ScrollView>
          {this.renderHomework(homeworks)}
          {this.renderLastEval(evaluations)}
        </ScrollView>
      </View>
    );
  }
}
