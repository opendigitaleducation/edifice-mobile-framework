import React from "react";
import { StyleSheet, Text } from "react-native";
import {layoutSize} from "../../styles/common/layoutSize";

export default class DialogTitle extends React.PureComponent {
  static displayName = "DialogTitle";

  render() {
    const { children } = this.props;
    return <Text style={styles.text}>{children}</Text>;
  }
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "600",
    fontFamily: "roboto bold",
    fontSize: layoutSize.LAYOUT_15,
    marginBottom: layoutSize.LAYOUT_8,
  },
});
