import { createStackNavigator } from 'react-navigation-stack';

import DrawerNavigatorWrapper from './containers/DrawerNavigatorWrapper';
import MailItem from './containers/MailContent';
import CreateMail from './containers/NewMail';
import Search from './containers/SearchFunction';

export default () =>
  createStackNavigator(
    {
      DrawerNavigator: DrawerNavigatorWrapper,
      mailDetail: MailItem,
      newMail: CreateMail,
      search: Search,
    },
    { initialRouteName: "DrawerNavigator", headerMode: "none" }
  );
