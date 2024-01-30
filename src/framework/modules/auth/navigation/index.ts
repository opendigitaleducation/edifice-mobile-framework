/**
 * Navigator for the auth section
 */
import {
  CommonActions,
  ParamListBase,
  Router,
  StackActionType,
  StackActions,
  StackNavigationState,
  StackRouter,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthCredentials, AuthPendingRedirection, AuthRequirement, ForgotMode } from '~/framework/modules/auth/model';
import moduleConfig from '~/framework/modules/auth/module-config';
import { AuthAccountSelectionScreenNavParams } from '~/framework/modules/auth/screens/account-selection/types';
import type { AuthChangeEmailScreenNavParams } from '~/framework/modules/auth/screens/change-email';
import type { AuthChangeMobileScreenNavParams } from '~/framework/modules/auth/screens/change-mobile';
import type { ChangePasswordScreenNavParams } from '~/framework/modules/auth/screens/change-password/types';
import type { LoginCredentialsScreenNavParams } from '~/framework/modules/auth/screens/login-credentials/types';
import type { AuthMFAScreenNavParams } from '~/framework/modules/auth/screens/mfa';
import { RouteStack } from '~/framework/navigation/helper';
import appConf, { Platform } from '~/framework/util/appConf';

import { IAuthState, getPlatform, getSession } from '../reducer';

// We use moduleConfig.name instead of moduleConfig.routeName because this module is not technically a NavigableModule.
export const authRouteNames = {
  accountSelection: `${moduleConfig.name}/accountSelection` as 'accountSelection',
  loginCredentials: `${moduleConfig.name}/login/credentials` as 'loginCredentials',
  loginWayf: `${moduleConfig.name}/login/wayf` as 'loginWayf',
  wayf: `${moduleConfig.name}/wayf` as 'wayf',
  onboarding: `${moduleConfig.name}/onboarding` as 'onboarding',
  platforms: `${moduleConfig.name}/platforms` as 'platforms',
  activation: `${moduleConfig.name}/activation` as 'activation',
  forgot: `${moduleConfig.name}/forgot` as 'forgot',
  revalidateTerms: `${moduleConfig.name}/revalidateTerms` as 'revalidateTerms',
  changePassword: `${moduleConfig.name}/changePassword` as 'changePassword',
  changePasswordModal: `${moduleConfig.name}/changePasswordModal` as 'changePasswordModal',
  changeEmail: `${moduleConfig.name}/changeEmail` as 'changeEmail',
  changeMobile: `${moduleConfig.name}/changeMobile` as 'changeMobile',
  mfa: `${moduleConfig.name}/mfa` as 'mfa',
  mfaModal: `${moduleConfig.name}/mfaModal` as 'mfaModal',
};

export interface IAuthNavigationParams extends ParamListBase {
  accountSelection: AuthAccountSelectionScreenNavParams;
  loginCredentials: LoginCredentialsScreenNavParams;
  loginWayf: { platform: Platform };
  wayf: { platform: Platform };
  activation: { platform: Platform; credentials: AuthCredentials };
  forgot: { platform: Platform; mode: ForgotMode; login?: string };
  revalidateTerms: object;
  changePassword: ChangePasswordScreenNavParams;
  changePasswordModal: ChangePasswordScreenNavParams;
  changeEmail: AuthChangeEmailScreenNavParams;
  changeMobile: AuthChangeMobileScreenNavParams;
  mfa: AuthMFAScreenNavParams;
  mfaModal: AuthMFAScreenNavParams;
}

/**
 * Get the right login route name for the given platfoem (credential /// wayf)
 * @param platform
 * @returns
 */
export const getLoginRouteName = (platform?: Platform) => {
  return platform?.wayf ? authRouteNames.loginWayf : authRouteNames.loginCredentials;
};

export const getNavActionForRequirement = (requirement: AuthRequirement) => {
  switch (requirement) {
    case AuthRequirement.MUST_CHANGE_PASSWORD:
      return CommonActions.reset({
        routes: [
          {
            name: authRouteNames.changePassword,
            params: {
              forceChange: true,
            },
          },
        ],
      });
    case AuthRequirement.MUST_REVALIDATE_TERMS:
      return CommonActions.reset({
        routes: [
          {
            name: authRouteNames.revalidateTerms,
          },
        ],
      });
    case AuthRequirement.MUST_VERIFY_MOBILE:
      return CommonActions.reset({
        routes: [
          {
            name: authRouteNames.changeMobile,
            params: {
              platform: getPlatform(),
              defaultMobile: getSession()?.user.mobile,
            },
          },
        ],
      });
    case AuthRequirement.MUST_VERIFY_EMAIL:
      return CommonActions.reset({
        routes: [
          {
            name: authRouteNames.changeEmail,
            params: {
              platform: getPlatform(),
              defaultEmail: getSession()?.user.email,
            },
          },
        ],
      });
  }
};

export const getNavActionForRedirect = (platform: Platform, pending: IAuthState['pending'] | undefined) => {
  switch (pending?.redirect) {
    case AuthPendingRedirection.ACTIVATE:
      return StackActions.push(authRouteNames.activation, {
        platform,
        credentials: {
          username: pending.loginUsed,
          password: pending.code,
        },
      });
    // // Uncomment this block to make a reset state instead of a push, making impossible to go back
    // return CommonActions.reset({
    //   routes: [
    //     {
    //       name: authRouteNames.activation,
    //       params: {
    //         platform,
    //         credentials: {
    //           username: pending.loginUsed,
    //           password: pending.code,
    //         },
    //       },
    //     },
    //   ],
    // });
    case AuthPendingRedirection.RENEW_PASSWORD:
      return StackActions.push(authRouteNames.changePassword, {
        platform,
        credentials: {
          username: pending.loginUsed,
          password: pending.code,
        },
        useResetCode: true,
      });
  }
};

/**
 * Dispatch the right nav action after onboarding, depending on platform configuration
 * @param navigation
 */
export function navigateAfterOnboarding(navigation: NativeStackNavigationProp<IAuthNavigationParams>) {
  if (appConf.hasMultiplePlatform) {
    navigation.navigate(authRouteNames.platforms);
  } else {
    const pf = appConf.platforms[0];
    navigation.navigate(getLoginRouteName(pf), { platform: pf }); // Auto-select first platform if not defined));
  }
}

/**
 * Simulate a nav action from the given nav state and returns the resulting nav state
 * @param action the nav action to simulate
 * @param state nav state (can be stale) to apply the nav action on
 * @returns The new nav State (will be rehydrated)
 */
const simulateNavAction = (
  action: CommonActions.Action | StackActionType,
  state: Parameters<Router<StackNavigationState<ParamListBase>, CommonActions.Action | StackActionType>['getRehydratedState']>[0],
) => {
  // We must instaciate a throwaway StackRouter to perform the action on the state and get the resulting one.
  const router = StackRouter({});
  const routeNames = Object.values(authRouteNames);
  const rehydratedState = router.getRehydratedState(state, { routeNames, routeParamList: {}, routeGetIdList: {} });
  const newState = router.getStateForAction(rehydratedState, action, { routeNames, routeParamList: {}, routeGetIdList: {} });
  return newState ?? state;
};

/**
 * Compute Auth navigation state from diven information from redux store
 * @param accounts
 * @param pending
 * @param showOnboarding
 * @returns
 */
export const getAuthNavigationState = (
  accounts: IAuthState['accounts'],
  pending: IAuthState['pending'],
  showOnboarding: IAuthState['showOnboarding'],
  requirement: IAuthState['requirement'],
) => {
  const routes = [] as RouteStack;
  const allPlatforms = appConf.platforms;

  // 1. Onboarding

  if (showOnboarding) {
    routes.push({ name: authRouteNames.onboarding });
    return;
  }

  // 2. PlatformSelect

  const multiplePlatforms = allPlatforms.length > 1;
  if (multiplePlatforms) {
    routes.push({ name: authRouteNames.platforms });
  }

  // 2. Login Screen

  let foundPlatform: string | Platform | undefined;
  let login: string | undefined;

  if (pending) {
    if (pending.redirect === undefined) {
      // Session restore
      const singleAccount = pending.account ? accounts[pending.account] : undefined;
      foundPlatform = singleAccount ? singleAccount.platform : undefined;
      login = singleAccount?.user.loginUsed;
    } else {
      // Activation && password renew
      foundPlatform = pending.platform;
      login = pending.loginUsed;
    }
  } else {
    const accountsAsArray = Object.values(accounts);
    const hasSingleAccount = accountsAsArray.length === 1;
    if (hasSingleAccount) {
      const singleAccount = accountsAsArray[0];
      foundPlatform = singleAccount && singleAccount.platform;
      login = singleAccount.user.loginUsed;
    }
  }

  const platform: Platform | undefined = multiplePlatforms
    ? foundPlatform
      ? typeof foundPlatform === 'string'
        ? allPlatforms.find(item => item.name === foundPlatform)
        : foundPlatform
      : undefined // Silenty go to the select page if the platform name has no correspondance.
    : allPlatforms[0];

  // Get platform name from pending auth task

  // Get the corresponding platform data

  // This is not the same screen depending of the platform data (federated or not)
  if (platform || !routes.length)
    routes.push({
      name: getLoginRouteName(platform),
      params: {
        platform,
        login,
      },
    });

  // 3. Login redirection for requirements

  let navRedirection: CommonActions.Action | StackActionType | undefined;
  if (requirement) {
    navRedirection = getNavActionForRequirement(requirement);
  } else if (
    platform &&
    (pending?.redirect === AuthPendingRedirection.ACTIVATE || pending?.redirect === AuthPendingRedirection.RENEW_PASSWORD)
  ) {
    navRedirection = getNavActionForRedirect(platform, pending);
  }

  // 4. Apply redirection if so

  if (!navRedirection) return { routes };

  const ret = simulateNavAction(navRedirection, { routes });
  // We must add `stale = false` into the resulting state to make React Navigation reinterpret and rehydrate this state if necessary.
  // @see https://reactnavigation.org/docs/navigation-state/#partial-state-objects
  return { ...ret, stale: true };
};
