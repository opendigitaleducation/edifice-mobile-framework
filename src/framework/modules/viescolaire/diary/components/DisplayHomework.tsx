import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import moment from 'moment';
import { PanGestureHandler, ScrollView, State } from 'react-native-gesture-handler';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { BodyBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { Homework } from '~/framework/modules/viescolaire/common/utils/diary';
import { LeftColoredItem } from '~/framework/modules/viescolaire/dashboard/components/Item';
import { PageContainer } from '~/ui/ContainerContent';
import HtmlContentView from '~/ui/HtmlContentView';

const styles = StyleSheet.create({
  LeftColoredItemInfoBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  course: {
    textTransform: 'uppercase',
    marginLeft: UI_SIZES.spacing.minor,
  },
  homeworkInfoBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  homeworkPart: {
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  mainView: {
    flex: 1,
  },
  subtitle: {
    color: theme.palette.grey.stone,
    marginBottom: UI_SIZES.spacing.medium,
  },
});

type IDisplayHomeworkProps = {
  homework: Homework;
  homeworkList: Homework[];
};

type IDisplayHomeworkState = {
  indexSelectedHomework: number;
  isRemovedDescription: boolean; // this variable is used to reset the description list in the <HtmlContentView /> component when the homeworkList is updated
};

export default class DisplayHomework extends React.PureComponent<IDisplayHomeworkProps, IDisplayHomeworkState> {
  constructor(props) {
    super(props);

    this.state = {
      indexSelectedHomework: 0,
      isRemovedDescription: true,
    };
  }

  componentDidMount() {
    const { homeworkList } = this.props;

    if (homeworkList && homeworkList.length === 1) {
      this.setState({ indexSelectedHomework: 0, isRemovedDescription: false });
    } else if (homeworkList) {
      const index = homeworkList.findIndex(item =>
        this.state.indexSelectedHomework
          ? item.id === homeworkList[this.state.indexSelectedHomework].id
          : item.id === this.props.homework.id,
      );
      this.setState({ indexSelectedHomework: index, isRemovedDescription: false });
    }
  }

  componentDidUpdate(prevProps) {
    const { homeworkList } = this.props;

    if (homeworkList && homeworkList.length === 1) {
      this.setState({ indexSelectedHomework: 0, isRemovedDescription: false });
    } else if (this.props.homeworkList && prevProps.homeworkList !== this.props.homeworkList) {
      const index = homeworkList.findIndex(item =>
        this.state.indexSelectedHomework
          ? item.id === homeworkList[this.state.indexSelectedHomework].id
          : item.id === this.props.homework.id,
      );
      this.setState({ indexSelectedHomework: index });
    } else if (this.state.isRemovedDescription) {
      this.setState({ isRemovedDescription: false });
    }
  }

  public onHomeworkChange = (selectedIndex: number) => {
    this.setState({ indexSelectedHomework: selectedIndex, isRemovedDescription: true });
  };

  public handleStateChange = ({ nativeEvent }) => {
    const { homeworkList } = this.props;
    const { indexSelectedHomework } = this.state;

    if (homeworkList !== undefined) {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX < 0 && indexSelectedHomework < homeworkList.length - 1) {
          this.onHomeworkChange(indexSelectedHomework + 1);
        } else if (nativeEvent.translationX > 0 && indexSelectedHomework > 0) {
          this.onHomeworkChange(indexSelectedHomework - 1);
        }
      }
    }
  };

  public render() {
    const { homeworkList } = this.props;
    const { indexSelectedHomework, isRemovedDescription } = this.state;
    const htmlOpts = {
      selectable: true,
    };

    return (
      <PageContainer>
        <PanGestureHandler onHandlerStateChange={this.handleStateChange}>
          <View style={styles.mainView}>
            <View style={styles.homeworkInfoBar}>
              <LeftColoredItem shadow style={styles.LeftColoredItemInfoBar} color={theme.palette.complementary.orange.regular}>
                {homeworkList && homeworkList[indexSelectedHomework]?.created_date ? (
                  <>
                    <Svg name="ui-calendarLight" width={20} height={20} fill={theme.palette.complementary.orange.regular} />
                    <SmallText>&ensp;{moment(homeworkList[indexSelectedHomework].created_date).format('DD/MM/YY')}</SmallText>
                  </>
                ) : null}
                {homeworkList && homeworkList[indexSelectedHomework]?.subject ? (
                  <SmallBoldText style={styles.course}>{homeworkList[indexSelectedHomework].subject}</SmallBoldText>
                ) : null}
              </LeftColoredItem>
            </View>

            <ScrollView>
              <View style={styles.homeworkPart}>
                <BodyBoldText>{I18n.get('diary-homework-homework')}</BodyBoldText>
                {homeworkList && homeworkList[indexSelectedHomework]?.due_date && (
                  <SmallText style={styles.subtitle}>
                    {I18n.get('diary-homework-duedate', {
                      date: moment(homeworkList[indexSelectedHomework].due_date).format('Do MMMM YYYY'),
                    })}
                  </SmallText>
                )}
                {!isRemovedDescription && homeworkList && homeworkList[indexSelectedHomework]?.description && (
                  <HtmlContentView html={homeworkList[indexSelectedHomework].description} opts={htmlOpts} />
                )}
              </View>
            </ScrollView>
          </View>
        </PanGestureHandler>
      </PageContainer>
    );
  }
}
