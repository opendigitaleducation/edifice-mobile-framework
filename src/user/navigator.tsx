import { createStackNavigator } from 'react-navigation-stack';

import ChangePasswordPage from './containers/ChangePasswordPage';
import ChildrenPage from './containers/ChildrenPage';
import LegalNoticeScreen from './containers/LegalNoticeScreen';
import PushNotifsSettingsScreen from './containers/PushNotifsSettingsScreen';
import RelativesPage from './containers/RelativesPage';
import SendEmailVerificationCodeScreen from './containers/SendEmailVerificationCodeScreen';
import StructuresPage from './containers/StructuresPage';
import VerifyEmailCodeScreen from './containers/VerifyEmailCodeScreen';
import WhoAreWeScreen from './containers/WhoAreWeScreen';
import XmasScreen from './containers/XmasScreen';
import UserAccountScreen from './containers/user-account';
import UserProfileScreen from './containers/user-profile';

export default createStackNavigator(
  {
    Profile: {
      screen: UserAccountScreen,
    },

    NotifPrefs: {
      screen: PushNotifsSettingsScreen,
    },

    Xmas: {
      screen: XmasScreen,
    },

    WhoAreWe: {
      screen: WhoAreWeScreen,
    },

    LegalNotice: {
      screen: LegalNoticeScreen,
    },

    MyProfile: {
      screen: UserProfileScreen,
    },

    ChangePassword: {
      screen: ChangePasswordPage,
    },

    SendEmailVerificationCode: {
      screen: SendEmailVerificationCodeScreen,
    },

    VerifyEmailCode: {
      screen: VerifyEmailCodeScreen,
    },

    Structures: {
      screen: StructuresPage,
    },

    Relatives: {
      screen: RelativesPage,
    },

    Children: {
      screen: ChildrenPage,
    },
  },
  {
    headerMode: 'none',
  },
);
