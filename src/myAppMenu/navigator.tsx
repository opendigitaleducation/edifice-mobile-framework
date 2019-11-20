import * as React from "react";
import { createStackNavigator, NavigationScreenProp } from "react-navigation";
import I18n from "i18n-js";

import { IAppModule } from "../infra/moduleTool";
import { getRoutes, getModules } from "../navigation/helpers/navBuilder";
import { standardNavScreenOptions, alternativeNavScreenOptions } from "../navigation/helpers/navScreenOptions";
import { HeaderAction, HeaderBackAction } from "../ui/headers/NewHeader";
import MyAppGrid from "./components/MyAppGrid";
import NotificationListPage from "./containers/NotificationListPage";

const MyAppGridContainer = (modules: IAppModule[]) => createStackNavigator({
  myAppsGrid: {
    screen: (props: any) => <MyAppGrid {...props} modules={modules} />,
    navigationOptions: ({ navigation }: { navigation: NavigationScreenProp<{}> }) =>
      standardNavScreenOptions(
        {
          title: I18n.t("MyApplications"),
          headerRight: <HeaderAction
            onPress={() => { navigation.navigate('notifications') }}
            //TODO: on-off logic? (redux)
            name={`icon-notif-${true? "on" : "off"}`}
            iconSize={36}
          />,
          headerLeftContainerStyle: {
            alignItems: "flex-start"
          },
          headerRightContainerStyle: {
            alignItems: "flex-start"
          },
          headerTitleContainerStyle: {
            alignItems: "flex-start",
            height: 55.667 // 🍔 Big (M)hack of the death of the world. The `alignItems` property doesn't seem to work here.
          }
        },
        navigation
      ),
  },
  notifications: {
    screen: NotificationListPage,
    navigationOptions: ({ navigation }: { navigation: NavigationScreenProp<{}> }) =>
    alternativeNavScreenOptions(
      {
        //TODO: translate
        title: "Toutes mes notifications",
        headerLeft: <HeaderBackAction navigation={navigation} />,
      },
      navigation
    ),
  }
});

export default (apps: string[]) => {
    const filter = (mod: IAppModule) => mod.config.hasRight(apps) && mod.config.group;
    const modules = getModules(filter);
    return createStackNavigator({
      myApps: MyAppGridContainer(modules),
      ...getRoutes(modules)
    }, {
      headerMode: "none"
    });
  };
