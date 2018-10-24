/**
 * HomeworkTaskPage
 *
 * Display page for just one task just one day.
 */

// imports ----------------------------------------------------------------------------------------

import style from "glamorous-native";
import * as React from "react";
const { Text, ScrollView, View } = style;

import { PageContainer } from "../../../ui/ContainerContent";

import moment, { Moment } from "moment";
// tslint:disable-next-line:no-submodule-imports
import "moment/locale/fr";
import { CommonStyles } from "../../../styles/common/styles";
moment.locale("fr");

import HtmlToJsx from "../../../infra/htmlConverter/jsx";

import memoize from "memoize-one";

// Main component ---------------------------------------------------------------------------------

export interface IHomeworkTaskPageDataProps {
  diaryId?: string;
  date?: Moment;
  taskId?: string;
  taskTitle?: string;
  taskContent?: string;
}

export interface IHomeworkTaskPageOtherProps {
  navigation?: any;
}

export type IHomeworkTaskPageProps = IHomeworkTaskPageDataProps &
  IHomeworkTaskPageOtherProps;

const convert = memoize(
  html =>
    HtmlToJsx(html, {
      formatting: false,
      hyperlinks: true,
      iframes: true,
      images: true
    }).render
);

export class HomeworkTaskPage extends React.PureComponent<
  IHomeworkTaskPageProps,
  {}
> {
  constructor(props) {
    super(props);
  }

  // render & lifecycle

  public render() {
    const { date, taskContent } = this.props;
    let formattedDate = date.format("dddd LL");
    formattedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
      <PageContainer>
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 20
          }}
        >
          <Text fontSize={14} color={CommonStyles.textColor} lineHeight={20}>
            {/* TODO typo */}
            {formattedDate}
          </Text>
          <View paddingTop={20}>{convert(taskContent)}</View>
        </ScrollView>
      </PageContainer>
    );
  }
}

export default HomeworkTaskPage;
