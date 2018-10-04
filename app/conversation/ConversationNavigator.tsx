import * as React from "react";
import { createStackNavigator } from "react-navigation";
import ThreadsTopBar from "./containers/ThreadsTopBar";
import Conversations from "./containers/Conversations";
import ConversationTopBar from "./containers/ConversationTopBar";
import NewConversation, {
  NewConversationHeader
} from "./containers/NewConversation";
import ThreadContent from "./containers/ThreadContent";

export default createStackNavigator({
  listThreads: {
    screen: Conversations,
    navigationOptions: ({ navigation }) => ({
      header: <ConversationTopBar navigation={navigation} />
    })
  },
  thread: {
    screen: ThreadContent,
    navigationOptions: ({ navigation }) => ({
      header: <ThreadsTopBar navigation={navigation} />,
      tabBarVisible: false
    })
  },
  newConversation: {
    screen: NewConversation,
    navigationOptions: ({ navigation }) => ({
      header: <NewConversationHeader navigation={navigation} />,
      tabBarVisible: false
    })
  }
});
