/**
 * ThreadListPage
 *
 * Display page for all threads.
 *
 * Props :
 *    `isFetching` - is data currently fetching from the server.
 *
 *    `navigation` - React Navigation instance.
 */

// Imports ----------------------------------------------------------------------------------------

// Libraries
import style from "glamorous-native";
import * as React from "react";
import I18n from "react-native-i18n";
import Swipeable from "react-native-swipeable";
import ViewOverflow from "react-native-view-overflow";

import moment from "moment";
// tslint:disable-next-line:no-submodule-imports
import "moment/locale/fr";
moment.locale("fr");

// Components
import { RefreshControl } from "react-native";
const { View, FlatList, Text } = style;
import styles from "../../styles";

import { Loading } from "../../ui";
import ConnectionTrackingBar from "../../ui/ConnectionTrackingBar";
import { PageContainer } from "../../ui/ContainerContent";
import { EmptyScreen } from "../../ui/EmptyScreen";
import ThreadItem from "../components/ThreadItem";

// Type definitions

import { IConversationThread } from "../reducers/threadList";

// Misc

// Props definition -------------------------------------------------------------------------------

export interface IThreadListPageDataProps {
  isFetching?: boolean;
  threads?: IConversationThread[];
}

export interface IThreadListPageEventProps {}

export interface IThreadListPageOtherProps {
  navigation?: any;
}

export type IThreadListPageProps = IThreadListPageDataProps &
  IThreadListPageEventProps &
  IThreadListPageOtherProps;

// Main component ---------------------------------------------------------------------------------

export class ThreadListPage extends React.PureComponent<
  IThreadListPageProps,
  {}
> {
  constructor(props) {
    super(props);
  }

  // Render

  public render() {
    const { isFetching, threads } = this.props;
    const isEmpty = threads.length === 0;

    const pageContent = isEmpty
      ? isFetching
        ? this.renderLoading()
        : this.renderEmptyScreen()
      : this.renderThreadList();

    return (
      <PageContainer>
        <ConnectionTrackingBar />
        {pageContent}
      </PageContainer>
    );
  }

  public renderLoading() {
    return <Loading />;
  }

  public renderEmptyScreen() {
    return (
      <EmptyScreen
        imageSrc={require("../../../assets/images/empty-screen/conversations.png")}
        imgWidth={571}
        imgHeight={261}
        text={I18n.t("conversation-emptyScreenText")}
        title={I18n.t("conversation-emptyScreenTitle")}
        scale={0.76}
      />
    );
  }

  public renderThreadList() {
    const { isFetching } = this.props;
    return (
      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            // onRefresh={() => this.fetchLatest()}
          />
        }
        data={this.props.threads}
        // onEndReached={() => this.nextPage()}
        renderItem={({ item }: { item: IConversationThread }) =>
          this.renderThreadItem(item)
        }
        keyExtractor={(item: IConversationThread) => item.id}
        style={styles.grid}
        keyboardShouldPersistTaps={"always"}
      />
    );
  }

  public renderThreadItem(thread: IConversationThread) {
    return (
      <Swipeable
        // rightButtons={this.swipeoutButton(item)}
        // onRightButtonsOpenRelease={(e, g, r) => (this.swipeRef = r)}
      >
        <ThreadItem
          {...thread}
          onPress={e => /*this.openConversation(item)*/ true}
        />
      </Swipeable>
    );
  }

  // Lifecycle

  // Event Handlers
}

export default ThreadListPage;
