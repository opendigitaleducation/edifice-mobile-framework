import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import moment from 'moment';
import { PanGestureHandler, ScrollView, State } from 'react-native-gesture-handler';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { BodyBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import viescoTheme from '~/framework/modules/viescolaire/common/theme';
import { Session } from '~/framework/modules/viescolaire/common/utils/diary';
import { LeftColoredItem } from '~/framework/modules/viescolaire/dashboard/components/Item';
import { PageContainer } from '~/ui/ContainerContent';
import HtmlContentView from '~/ui/HtmlContentView';

const styles = StyleSheet.create({
  course: {
    textTransform: 'uppercase',
    marginLeft: UI_SIZES.spacing.minor,
  },
  LeftColoredItemInfoBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  mainView: {
    flex: 1,
  },
  pageTitle: {
    color: theme.palette.grey.stone,
    textTransform: 'uppercase',
  },
  sessionInfoBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sessionPart: {
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.minor,
  },
});

type IDisplaySessionProps = {
  session: Session;
  sessionList: Session[];
};

type IDisplaySessionState = {
  indexSelectedSession: number;
  isRemovedDescription: boolean; // this variable is used to reset the description list in the <HtmlContentView /> component when the homeworkList is updated
};

export default class DisplaySession extends React.PureComponent<IDisplaySessionProps, IDisplaySessionState> {
  constructor(props) {
    super(props);

    this.state = {
      indexSelectedSession: 0,
      isRemovedDescription: true,
    };
  }

  componentDidMount() {
    const { sessionList } = this.props;

    if (this.props.sessionList) {
      const index = sessionList.findIndex(item =>
        this.state.indexSelectedSession
          ? item.id === sessionList[this.state.indexSelectedSession].id
          : item.id === this.props.session.id,
      );
      this.setState({ indexSelectedSession: index, isRemovedDescription: false });
    }
  }

  componentDidUpdate(prevProps) {
    const { sessionList } = this.props;

    if (this.props.sessionList && prevProps.sessionList !== this.props.sessionList) {
      const index = sessionList.findIndex(item =>
        this.state.indexSelectedSession
          ? item.id === sessionList[this.state.indexSelectedSession].id
          : item.id === this.props.session.id,
      );
      this.setState({ indexSelectedSession: index });
    } else if (this.state.isRemovedDescription) {
      this.setState({ isRemovedDescription: false });
    }
  }

  public onSessionChange = (selectedIndex: number) => {
    this.setState({ indexSelectedSession: selectedIndex, isRemovedDescription: true });
  };

  public handleStateChange = ({ nativeEvent }) => {
    const { sessionList } = this.props;
    const { indexSelectedSession } = this.state;

    if (sessionList !== undefined) {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX < 0 && indexSelectedSession < sessionList.length - 1) {
          this.onSessionChange(indexSelectedSession + 1);
        } else if (nativeEvent.translationX > 0 && indexSelectedSession > 0) {
          this.onSessionChange(indexSelectedSession - 1);
        }
      }
    }
  };

  public render() {
    const { sessionList } = this.props;
    const { indexSelectedSession, isRemovedDescription } = this.state;
    const htmlOpts = {
      selectable: true,
    };

    return (
      <PageContainer>
        <PanGestureHandler onHandlerStateChange={this.handleStateChange}>
          <View style={styles.mainView}>
            <View style={styles.sessionInfoBar}>
              <LeftColoredItem shadow style={styles.LeftColoredItemInfoBar} color={viescoTheme.palette.diary}>
                {sessionList && sessionList[indexSelectedSession]?.date ? (
                  <>
                    <Svg name="ui-calendarLight" width={20} height={20} fill={viescoTheme.palette.diary} />
                    <SmallText>&ensp;{moment(sessionList[indexSelectedSession].date).format('DD/MM/YY')}</SmallText>
                  </>
                ) : null}
                {sessionList && sessionList[indexSelectedSession]?.subject ? (
                  <SmallBoldText style={styles.course}>{sessionList[indexSelectedSession].subject}</SmallBoldText>
                ) : null}
              </LeftColoredItem>
            </View>

            <ScrollView>
              <View style={styles.sessionPart}>
                <SmallText style={styles.pageTitle}>{I18n.get('diary-session-session')}</SmallText>
                {sessionList && sessionList[indexSelectedSession]?.title && (
                  <BodyBoldText>{sessionList[indexSelectedSession].title}</BodyBoldText>
                )}
                {!isRemovedDescription && sessionList && sessionList[indexSelectedSession]?.description && (
                  <HtmlContentView html={sessionList[indexSelectedSession].description} opts={htmlOpts} />
                )}
              </View>
            </ScrollView>
          </View>
        </PanGestureHandler>
      </PageContainer>
    );
  }
}
