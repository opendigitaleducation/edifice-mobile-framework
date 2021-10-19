import I18n from "i18n-js";
import React from "react";
import { NavigationState } from "react-navigation";
import { createDrawerNavigator, NavigationDrawerProp } from "react-navigation-drawer";

import { standardNavScreenOptions } from "../../../navigation/helpers/navScreenOptions";
import { CommonStyles } from "../../../styles/common/styles";
import { PageContainer } from "../../../ui/ContainerContent";
import TouchableOpacity from "../../../ui/CustomTouchableOpacity";
import TempFloatingAction from "../../../ui/FloatingButton/TempFloatingAction";
import { Text } from "../../../ui/Typography";
import { Header as HeaderComponent } from "../../../ui/headers/Header";
import { HeaderAction } from "../../../ui/headers/NewHeader";
import DrawerMenuContainer from "./DrawerMenu";
import MailList from "./MailList";
import { DraftType } from "./NewMail";
import { Icon } from "../../../ui";
import { View } from "react-native";

const DrawerNavigatorComponent = createDrawerNavigator(
  {
    inbox: MailList,
    sendMessages: MailList,
    drafts: MailList,
    trash: MailList,
    spams: MailList,
    folder: MailList,
  },
  {
    contentComponent: DrawerMenuContainer,
    edgeWidth: -1,
  }
);

export const IconButton = ({ icon, color, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{}}>
      <Icon size={16} color={color} name={icon} />
    </TouchableOpacity>
  );
};

export default class DrawerNavigatorWrapper extends React.Component<any, any> {
  static router = DrawerNavigatorComponent.router;
  static navigationOptions = ({ navigation }: { navigation: NavigationDrawerProp<any> }) => {
    return standardNavScreenOptions(
      {
        header: null,
      },
      navigation
    );
  };

  getTitle = (activeRoute: any) => {
    const { key, params } = activeRoute;
    if (params !== undefined && params.folderName !== undefined) return params.folderName;
    switch (key) {
      case "sendMessages":
        return I18n.t("zimbra-outbox");
      case "drafts":
        return I18n.t("zimbra-drafts");
      case "trash":
        return I18n.t("zimbra-trash");
      case "spams":
        return I18n.t("zimbra-spams");
      default:
      case "inbox":
        return I18n.t("zimbra-inbox");
    }
  };

  getActiveRouteState = (route: NavigationState) => {
    if (!route.routes || route.routes.length === 0 || route.index >= route.routes.length) {
      return route;
    }

    const childActiveRoute = route.routes[route.index] as NavigationState;
    return this.getActiveRouteState(childActiveRoute);
  };

  public render() {
    const { navigation } = this.props;
    const title = this.getTitle(this.getActiveRouteState(navigation.state));
    const params = this.getActiveRouteState(navigation.state).params;

    return (
      <PageContainer>
        {(!params || !params.selectedMails) && (
          <HeaderComponent>
            <HeaderAction
              name="menu"
              onPress={() => {
                navigation.toggleDrawer();
              }}
            />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
              <Text
                numberOfLines={1}
                style={{
                  alignSelf: "center",
                  paddingRight: 10,
                  color: "white",
                  fontFamily: CommonStyles.primaryFontFamily,
                  fontSize: 16,
                  fontWeight: "400",
                  textAlign: "center",
                }}>
                {title}
              </Text>
              <View style={{ marginRight: 50, marginTop: 3 }}>
                <IconButton onPress={() => navigation.navigate("search")} color="#FFF" icon="search2" />
              </View>
            </View>
          </HeaderComponent>
        )}
        <DrawerNavigatorComponent navigation={navigation} />
        {(!params || !params.selectedMails) && (
          <TempFloatingAction
            iconName="new_message"
            onEvent={() => {
              this.props.navigation.navigate("newMail", {
                type: DraftType.NEW,
                mailId: undefined,
                currentFolder: this.getActiveRouteState(navigation.state).key,
              });
            }}
          />
        )}
      </PageContainer>
    );
  }
}
