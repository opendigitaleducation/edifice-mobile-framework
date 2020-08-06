import * as React from "react";
import { View, TextStyle, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import I18n from "i18n-js";
import style from "glamorous-native";

import { 
  IThreadPageDataProps,
  IThreadPageEventProps, 
  IThreadPageProps, 
  ThreadPage 
} from "../components/ThreadPage";
import conversationConfig from "../config";
import { 
  fetchConversationThreadNewerMessages, 
  fetchConversationThreadOlderMessages
} from "../actions/apiHelper";
import { createActionReceiversDisplay, createActionThreadReceiversDisplay } from "../actions/displayReceivers";
import { IConversationMessage, IConversationThread, IConversationMessageList } from "../reducers";
import { NavigationScreenProp } from "react-navigation";
import { standardNavScreenOptions, alternativeNavScreenOptions } from "../../navigation/helpers/navScreenOptions";
import { HeaderBackAction, HeaderIcon, HeaderAction } from "../../ui/headers/NewHeader";
import { getSessionInfo } from "../../App";
import { RowAvatars } from "../../ui/avatars/RowAvatars";
import { CommonStyles } from "../../styles/common/styles";
import { FontWeight, Text } from "../../ui/text";
import deviceInfoModule from "react-native-device-info";
import withViewTracking from "../../infra/tracker/withViewTracking";
import { IconButton } from "../../ui/IconButton";

const mapStateToProps: (state: any) => IThreadPageDataProps = state => {
  // Extract data from state
  const localState: IConversationMessageList = state[conversationConfig.reducerName].messages;
  const selectedThreadId: string = state[conversationConfig.reducerName].threadSelected;
  const selectedThread: IConversationThread =
    state[conversationConfig.reducerName].threadList.data.byId[
      selectedThreadId
    ];
  // console.log("display thread", localState, selectedThreadId, selectedThread);
  const messages: IConversationMessage[] = selectedThread && selectedThread.messages.map(
    messageId => localState.data[messageId]
    );
  const headerHeight = state.ui.headerHeight; // TODO: Ugly.

  // Format props
  return {
    headerHeight,
    isFetching: selectedThread && selectedThread.isFetchingOlder,
    isRefreshing: selectedThread && selectedThread.isFetchingNewer,
    isFetchingFirst: selectedThread && selectedThread.isFetchingFirst,
    messages,
    threadInfo: selectedThread
  };
};

const mapDispatchToProps: (
  dispatch: any
  ) => IThreadPageEventProps = dispatch => {
  return {
    dispatch,
    onGetNewer: async (threadId: string) => {
      // console.log("get newer posts");
      await dispatch(fetchConversationThreadNewerMessages(threadId));
      return;
    },
    onGetOlder: (threadId: string) => {
      // console.log("get older posts");
      dispatch(fetchConversationThreadOlderMessages(threadId));
      return;
    },
    onTapReceivers: (message: IConversationMessage) => {
      dispatch(createActionReceiversDisplay(message))
      return;
    },
    onTapReceiversFromThread: (thread: IConversationThread) => {
      dispatch(createActionThreadReceiversDisplay(thread))
      return;
    }
  };
};

class ThreadPageContainer extends React.PureComponent<
  IThreadPageProps & { dispatch: any }, 
  { selectedMessage?: IConversationMessage }
  > {

  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<{}> }) => {
    const showDetails = navigation.getParam("showDetails", false);
    const threadInfo = navigation.getParam("threadInfo");
    const onTapReceivers = navigation.getParam("onTapReceivers");
    const selectedMessage: IConversationMessage | undefined = navigation.getParam("selectedMessage");
    if (selectedMessage) {
      return alternativeNavScreenOptions({
        headerLeft: <HeaderAction name="close" onPress={() => {
          navigation?.setParams({ selectedMessage: undefined });
        }}/>,
        headerRight: <View style={{ flexDirection: "row" }}>
          <HeaderAction title={I18n.t("conversation-reply")} onPress={() => {
            navigation.navigate('newThread', {
              type: 'reply',
              message: selectedMessage
            })
          }}/>
          <HeaderAction title={I18n.t("conversation-transfer")} onPress={() => {
            navigation.navigate('newThread', {
              type: 'transfer',
              message: selectedMessage
            })
          }}/>
        </View>,
        headerStyle: {
          backgroundColor: CommonStyles.orangeColorTheme
        },
        headerTitle: null
      }, navigation);
    } else {
      return standardNavScreenOptions({
        headerLeft: showDetails ? null : <HeaderBackAction navigation={navigation} />,
        headerRight: showDetails
          ? null
          : <View style={{flexDirection: "row", alignItems: "center"}}>
              <View style={{ width: 1, height: "80%", backgroundColor: "#FFF" }} />
              <HeaderAction
                  customComponent={
                    <View 
                      style={{ 
                        alignItems: "center",
                        justifyContent: "center",
                        width: 70,
                        height: "100%"
                      }}
                    >
                      <IconButton
                        iconName="informations"
                        iconSize={16}
                        buttonStyle={{ height: 18, width: 18, borderRadius: undefined, backgroundColor: undefined }}
                      />
                      <LittleTitle smallSize italic>
                        {I18n.t("seeDetails")}
                      </LittleTitle>
                    </View>
                  }
                  onPress={() => {
                    //TODO move orchestration to thunk
                    onTapReceivers && onTapReceivers(threadInfo);
                    navigation.navigate("listReceivers");
                  }}
                />
            </View>,
        headerTitle: threadInfo ?
          showDetails ?
            ThreadPageContainer.renderDetailsThreadHeader(threadInfo, navigation)
            :
            ThreadPageContainer.renderThreadHeader(threadInfo, navigation)
          : <View><Text>Loading</Text></View>,
        headerStyle: {
          height: showDetails
            ? deviceInfoModule.hasNotch()
              ? 100 + 160 : 56 + 160
            : deviceInfoModule.hasNotch()
              ? 100 : 56
        },
        headerLeftContainerStyle: {
          alignItems: "flex-start"
        },
        headerRightContainerStyle: {
          alignItems: "flex-start"
        },
        headerTitleContainerStyle: {
          alignItems: "flex-start"
        }
      }, navigation);
    }
  }

  static getAvatarsAndNamesSet(threadInfo: IConversationThread) {
    const { displayNames, to, from } = threadInfo;
    let { cc } = threadInfo;
    cc = cc || [];
    const imageSet = new Set(
      [...to, ...cc, from].filter(el => el && el !== getSessionInfo().userId)
    );
    if (imageSet.size === 0) {
      imageSet.add(getSessionInfo().userId!);
    }
    const images = [...imageSet].map((receiverId: string) => {
      const foundDisplayName = displayNames.find(displayName => displayName[0] === receiverId);
      return foundDisplayName ? { id: receiverId, isGroup: foundDisplayName[2] } : {};
    })
    
    const names = [...imageSet].map((receiverId: string) => {
      const foundDisplayName = displayNames.find(displayName => displayName[0] === receiverId);
      return foundDisplayName ? foundDisplayName[1] : I18n.t("unknown-user");
    });
    return { images, names };
  }

  static renderThreadHeader(threadInfo: IConversationThread, navigation: NavigationScreenProp<{}>) {
    const receiversText = threadInfo.to.length > 1
      ? I18n.t("conversation-receivers", { count: threadInfo.to.length })
      : I18n.t("conversation-receiver");

    return (
      <CenterPanel onPress={() => { navigation.setParams({ showDetails: true }); }}>
          <LittleTitle numberOfLines={1} smallSize>
            {threadInfo.subject}
          </LittleTitle>
          <LittleTitle smallSize italic>
            {receiversText}
          </LittleTitle>
      </CenterPanel>
    )
  }

  static renderDetailsThreadHeader(threadInfo: IConversationThread, navigation: NavigationScreenProp<{}>) {
    const { images, names } = ThreadPageContainer.getAvatarsAndNamesSet(threadInfo);
    return <View style={{
          alignItems: "stretch",
          width: "100%",
          flex: 0,
        }}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <HeaderBackAction navigation={navigation} style={{ flex: 0 }}/>
          <View style={{flex: 1, alignItems: "stretch"}}>
            <CenterPanel onPress={() => navigation.setParams({ showDetails: false })}>
              <LittleTitle numberOfLines={2}>
                {threadInfo.subject}
              </LittleTitle>
            </CenterPanel>
          </View>
          <HeaderIcon name={null} />
        </View>
        <ContainerAvatars>
          <RowAvatars
            images={images}
            onSlideIndex={slideIndex => {navigation.setParams({ slideIndex: slideIndex })}}
          />
          <Legend14 numberOfLines={2}>
            {names[navigation.getParam("slideIndex", 0)]}
          </Legend14>
        </ContainerAvatars>
      </View>
  }

  constructor(props: IThreadPageProps) {
    super(props);
    this.props.navigation!.setParams({
      threadInfo: this.props.threadInfo,
      onTapReceivers: this.props.onTapReceivers
    });
  }

  public render() {
    const backMessage = this.props.navigation?.getParam('message');
    const sendingType = this.props.navigation?.getParam('type', 'new');
    return (
      <ThreadPage
        {...this.props}
        onSelectMessage={message => {
          this.props.navigation?.setParams({ selectedMessage: message });
        }}
        backMessage={backMessage}
        sendingType={sendingType}
      />
    );
  }
}

const ThreadPageContainerConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(ThreadPageContainer);

export default withViewTracking("conversation/thread")(ThreadPageContainerConnected);

export const CenterPanel = style(TouchableOpacity)({
  alignItems: "stretch",
  justifyContent: "center",
  paddingVertical: 5,
  height: 56,
  flex: 1,
});

export const LittleTitle = (style.text as any)(
  {
    color: "white",
    fontFamily: CommonStyles.primaryFontFamily,
    fontWeight: "400",
    textAlign: "center",
  },
  ({ smallSize = false, italic = false }: { smallSize: boolean, italic: boolean }) => ({
    fontSize: smallSize ? 12 : 16,
    fontStyle: italic ? "italic" : "normal",
  })
);

export const ContainerAvatars = style.view({
  alignItems: "center",
  flex: 0,
  height: 160,
  justifyContent: "flex-start",
});

const legendStyle: TextStyle = {
  alignSelf: "center",
  color: "white",
  flexWrap: "nowrap",
};

const Legend14 = style.text({
  ...legendStyle,
  fontFamily: CommonStyles.primaryFontFamily,
  fontWeight: FontWeight.Bold,
  textAlign: "center",
  textAlignVertical: "center",
  width: "66%",
  marginBottom: 10,
  height: 40,
});
