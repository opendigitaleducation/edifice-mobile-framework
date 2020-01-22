import * as React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { NavigationEventSubscription } from "react-navigation";
import { FilterId, IItem, IItemsProps, IState } from "../types";
import { Item } from "../components";
import { listAction } from "../actions/list";
import { CommonStyles } from "../../styles/common/styles";
import { layoutSize } from "../../styles/common/layoutSize";
import ConnectionTrackingBar from "../../ui/ConnectionTrackingBar";
import { getEmptyScreen } from "../utils/empty";
import { PageContainer } from "../../ui/ContainerContent";
import { Loading, ProgressBar } from "../../ui";
import { removeAccents } from "../../utils/string";
import withUploadWrapper from "../utils/withUploadWrapper";
import withMenuWrapper from "../utils/withMenuWrapper";
import withNavigationWrapper from "../utils/withNavigationWrapper";
import { ISelectedProps } from "../../types/ievents";
import { uploadAction } from "../actions/upload";
import {nbItems} from "../utils";

const styles = StyleSheet.create({
  separator: {
    borderBottomColor: CommonStyles.borderColorLighter,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginLeft: layoutSize.LAYOUT_84,
  },
});

export class Items extends React.PureComponent<IItemsProps & ISelectedProps, { isFocused: boolean }> {
  focusListener!: NavigationEventSubscription;

  public componentDidMount() {
    this.focusListener = this.props.navigation.addListener("willFocus", () => {
      this.makeRequest();
    });
  }

  public componentWillUnmount() {
    this.focusListener.remove();
  }

  public makeRequest() {
    this.props.listAction({
      filter: this.props.navigation.getParam("filter"),
      parentId: this.props.navigation.getParam("parentId"),
    });
  }

  private sortItems(a: IItem, b: IItem): number {
    const sortByType = (a: IItem, b: IItem): number => {
      if (a.isFolder === b.isFolder) {
        return 0;
      } else {
        return a.isFolder ? -1 : 1;
      }
    };

    const sortByName = (a: IItem, b: IItem): number => {
      return removeAccents(a.name.toLocaleLowerCase()).localeCompare(removeAccents(b.name.toLocaleLowerCase()));
    };

    return sortByType(a, b) !== 0 ? sortByType(a, b) : sortByName(a, b);
  }

  public render(): React.ReactNode {
    const getViewToRender = ({ items, isFetching = false, selectedItems }: IItemsProps & ISelectedProps) => {
      if (items === undefined) {
        return <Loading />;
      }

      const values = Object.values(items);
      const parentId = this.props.navigation.getParam("parentId") || null;
      const itemsArray = parentId === FilterId.root ? values : values.sort(this.sortItems);

      return (
        <FlatList
          contentContainerStyle={{ flexGrow: 1 }}
          data={itemsArray}
          ListEmptyComponent={getEmptyScreen(parentId)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item: IItem) => item.id}
          refreshing={isFetching}
          onRefresh={() => this.makeRequest()}
          renderItem={({ item }) => (
            <Item item={item} onEvent={this.props.onEvent} selected={selectedItems[item.id]} simple={false} />
          )}
        />
      );
    };

    return (
      <PageContainer>
        <ConnectionTrackingBar />
        <ProgressBar />
        {getViewToRender(this.props)}
      </PageContainer>
    );
  }
}

const getProps = (stateItems: IState, props: any) => {
  const parentId = props.navigation.getParam("parentId");
  const parentIdItems = stateItems[parentId] || {};
  const isFetching = parentIdItems.isFetching || false;

  return { isFetching, items: parentIdItems.data };
};

const mapStateToProps = (state: any, props: any) => {
  return {
    selectedItems: state.workspace.selected,
    nbSelectedItems: nbItems(state.workspace.selected),
    ...getProps(state.workspace.items, props),
  };
};

export default connect(mapStateToProps, { listAction, uploadAction })(
  withMenuWrapper(withNavigationWrapper(withUploadWrapper(Items)))
);
