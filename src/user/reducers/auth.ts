import {
  actionTypeLoggedIn,
  actionTypeLoggedOut,
  actionTypeLoginCancel,
  actionTypeLoginError,
  actionTypeRequestLogin
} from "../actions/login";
import { actionTypeSetNotifPrefs } from "../actions/notifPrefs";
import { actionTypePlatformSelect } from "../actions/platform";
import {
  actionTypeNewVersion,
  actionTypeRequestVersion,
  actionTypeSkipVersion,
  INewVersionAction,
  IVersionContext
} from "../actions/version";
import {getMainNavContainer} from "../../navigation/RootNavigator";
import {NavigationContainer} from "react-navigation";

// TYPE DEFINITIONS -------------------------------------------------------------------------------

export interface IUserAuthState {
  // user account information
  login?: string;
  userId?: string;
  error?: string;
  notificationPrefs?: any[];
  // user auth state
  loggedIn: boolean;
  synced: boolean;
  loggingIn: boolean;
  // available applications
  apps: string[];
  appsInfo: string[];
  // technical
  notification: Notification;
  // platform
  platformId?: string;
  //version
  skipVersion: boolean;
  versionContext: IVersionContext;
  MainNavigationContainer: NavigationContainer | null
}

// THE REDUCER ------------------------------------------------------------------------------------

export const stateDefault: IUserAuthState = {
  apps: [],
  appsInfo: [],
  loggedIn: false,
  loggingIn: false,
  MainNavigationContainer: null,
  notification: null,
  notificationPrefs: [],
  platformId: null,
  synced: false,
  skipVersion: false,
  versionContext: null
};

const authReducer = (
  state: IUserAuthState = stateDefault,
  action
): IUserAuthState => {
  switch (action.type) {
    case actionTypeSkipVersion: {
      return {
        ...state,
        skipVersion: true
      };
    }
    case actionTypeNewVersion: {
      const aVersion: INewVersionAction = action;
      return {
        ...state,
        loggingIn: false,
        versionContext: { ...aVersion }
      };
    }
    case actionTypeRequestLogin:
    case actionTypeRequestVersion:
      return {
        ...state,
        error: "",
        loggingIn: true
      };
    case actionTypeLoggedIn:
      return {
        ...state,
        apps: action.userbook.apps,
        appsInfo: action.userbook.appsInfo,
        error: "",
        loggedIn: true,
        loggingIn: false,
        login: action.userbook.login,
        MainNavigationContainer: getMainNavContainer(["user", "myapps", ...action.userbook.apps]),
        synced: true,
        userId: action.userbook.id
      };
    case actionTypeLoginError:
      return {
        ...stateDefault,
        error: action.errmsg,
        loggingIn: false,
        platformId: state.platformId
      };
    case actionTypeLoginCancel:
      return {
        ...state,
        loggingIn: false
      };
    case actionTypeLoggedOut:
      return {
        ...stateDefault,
        platformId: state.platformId
      };
    case actionTypeSetNotifPrefs:
      return {
        ...state,
        notificationPrefs: action.notificationPrefs
      };
    case "NOTIFICATION_OPEN":
      return {
        ...state,
        notification: action.notification
      };
    case actionTypePlatformSelect:
      return {
        ...state,
        platformId: action.platformId
      };
    default:
      return state;
  }
};

export default authReducer;
