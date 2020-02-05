import React, { Component } from "react";
import { FlatList, Keyboard, StyleSheet, View } from "react-native";
import FloatingActionItem from "./FloatingActionItem";
import { layoutSize } from "../../styles/common/layoutSize";
import { CommonStyles } from "../../styles/common/styles";
import { IFloatingProps, IMenuItem } from "../types";
import { ISelected } from "../Toolbar/Toolbar";
import TouchableOpacity from "../CustomTouchableOpacity";
import { ButtonIconText } from "..";

class FloatingAction extends Component<IFloatingProps & ISelected, IState> {
  state = {
    active: false,
  };

  visible = true;

  getShadow = () => {
    return {
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 5,
        height: 8,
      },
      shadowOpacity: 0.45,
      shadowRadius: 3.84,
    };
  };

  reset = () => {
    this.setState({
      active: false,
    });
  };

  animateButton = () => {
    const { active } = this.state;

    Keyboard.dismiss();

    if (!active) {
      this.setState({
        active: true,
      });
    } else {
      this.reset();
    }
  };

  handleEvent = (event: any): void => {
    const { onEvent } = this.props;

    if (onEvent) {
      onEvent(event);
    }
    this.reset();
  };

  renderMainButton() {
    const { menuItems } = this.props;
    const iconName = this.state.active ? "close" : "add";

    if (!menuItems || menuItems.length === 0) {
      return null;
    }

    return (
      <ButtonIconText style={styles.button} name={iconName} onPress={this.animateButton}  />
    );
  }

  renderActions() {
    const { menuItems } = this.props;
    const { active } = this.state;

    if (!active || !menuItems || menuItems.length === 0) {
      return undefined;
    }

    return (
      <FlatList
        contentContainerStyle={styles.actions}
        data={menuItems}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item: IMenuItem) => item.id}
        renderItem={({ item }) => <FloatingActionItem item={item} onEvent={this.handleEvent.bind(this)} />}
      />
    );
  }

  render() {
    const { selected } = this.props;

    if (selected.length) {
      return null;
    }

    const { menuItems } = this.props;
    const { active } = this.state;

    if (active) {
      return (
        <View style={styles.overlay}>
          {this.renderMainButton()}
          <TouchableOpacity onPress={this.animateButton} style={styles.overlayActions}>
            {this.renderActions()}
          </TouchableOpacity>
        </View>
      );
    }

    if (!active || (menuItems && menuItems.length === 0)) {
      return <View style={styles.overlay}>{this.renderMainButton()}</View>;
    }

    return null;
  }
}

interface IState {
  active: boolean;
}

const styles = StyleSheet.create({
  actions: {
    elevation: 10,
    borderRadius: layoutSize.LAYOUT_6,
    overflow: "visible",
    backgroundColor: "#ffffff",
    position: "absolute",
    right: layoutSize.LAYOUT_2,
    top: 0,
    width: layoutSize.LAYOUT_200,
    zIndex: 10,
  },
  button: {
    elevation: 10,
    position: "absolute",
    right: layoutSize.LAYOUT_20,
    top: -layoutSize.LAYOUT_34,
    zIndex: 10,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlayActions: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: layoutSize.LAYOUT_26,
  },
  separator: {
    borderBottomColor: CommonStyles.borderColorLighter,
    borderBottomWidth: 1,
    width: "100%",
  },
});

export default FloatingAction;
