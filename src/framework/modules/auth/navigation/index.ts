/**
 * Navigator for the auth section
 */
import { ParamListBase, Router, StackNavigationState, StackRouter } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/auth/module-config';
import type { AuthOnboardingAddAccountScreenNavParams } from '~/framework/modules/auth/screens/add-account/onboarding';
import type { AuthChangeEmailScreenNavParams } from '~/framework/modules/auth/screens/change-email';
import type { AuthChangeMobileScreenNavParams } from '~/framework/modules/auth/screens/change-mobile';
import type { AuthDiscoveryClassScreenNavParams } from '~/framework/modules/auth/screens/discovery-class';
import type { AuthAccountSelectionScreenNavParams } from '~/framework/modules/auth/screens/main-account/account-selection/types';
import type { AuthAddAccountModalScreenNavParams } from '~/framework/modules/auth/screens/main-account/add-account-modal';
import { AuthLoginRedirectScreenNavParams } from '~/framework/modules/auth/screens/main-account/login-redirect';
import type { AuthLoginWayfScreenNavParams } from '~/framework/modules/auth/screens/main-account/login-wayf';
import type { AuthOnboardingScreenNavParams } from '~/framework/modules/auth/screens/main-account/onboarding';
import type { AuthPlatformsScreenNavParams } from '~/framework/modules/auth/screens/main-account/platforms';
import type { AuthMFAScreenNavParams } from '~/framework/modules/auth/screens/mfa';
import type { ActivationScreenNavParams } from '~/framework/modules/auth/templates/activation';
import type { ChangePasswordScreenNavParams } from '~/framework/modules/auth/templates/change-password/types';
import type { ForgotScreenNavParams } from '~/framework/modules/auth/templates/forgot';
import type { LoginCredentialsScreenNavParams } from '~/framework/modules/auth/templates/login-credentials/types';
import type { StackNavigationAction } from '~/framework/navigation/types';
import type { Platform } from '~/framework/util/appConf';

// We use moduleConfig.name instead of moduleConfig.routeName because this module is not technically a NavigableModule.
export const authRouteNames = {
  // Login stack (normal version)
  onboarding: `${moduleConfig.name}/onboarding` as 'onboarding',
  platforms: `${moduleConfig.name}/platforms` as 'platforms',
  loginCredentials: `${moduleConfig.name}/login/credentials` as 'loginCredentials',
  loginWayf: `${moduleConfig.name}/login/wayf` as 'loginWayf',
  loginRedirect: `${moduleConfig.name}/login/redirect` as 'loginRedirect',
  wayf: `${moduleConfig.name}/wayf` as 'wayf',
  activation: `${moduleConfig.name}/activation` as 'activation',
  changePassword: `${moduleConfig.name}/changePassword` as 'changePassword',
  forgot: `${moduleConfig.name}/forgot` as 'forgot',
  accounts: `${moduleConfig.name}/accounts` as 'accounts', // This screen is exclusive to normal login stack
  // Login stack (add account version)
  addAccountOnboarding: `${moduleConfig.name}/add-account/onboarding` as 'addAccountOnboarding',
  addAccountPlatforms: `${moduleConfig.name}/add-account/platforms` as 'addAccountPlatforms',
  addAccountLoginCredentials: `${moduleConfig.name}/add-account/login/credentials` as 'addAccountLoginCredentials',
  addAccountLoginWayf: `${moduleConfig.name}/add-account/login/wayf` as 'addAccountLoginWayf',
  addAccountWayf: `${moduleConfig.name}/add-account/wayf` as 'addAccountWayf',
  addAccountLoginRedirect: `${moduleConfig.name}/add-account/redirect` as 'addAccountLoginRedirect',
  addAccountActivation: `${moduleConfig.name}/add-account/activation` as 'addAccountActivation',
  addAccountChangePassword: `${moduleConfig.name}/add-account/changePassword` as 'addAccountChangePassword',
  addAccountForgot: `${moduleConfig.name}/add-account/forgot` as 'addAccountForgot',
  // Exclusive logged screen (normal auth stack)
  addAccountModal: `${moduleConfig.name}/add-account/modal` as 'addAccountModal', // This is the add acount stack parent screen.
  revalidateTerms: `${moduleConfig.name}/revalidateTerms` as 'revalidateTerms',
  changePasswordModal: `${moduleConfig.name}/changePasswordModal` as 'changePasswordModal',
  changeEmail: `${moduleConfig.name}/changeEmail` as 'changeEmail',
  changeMobile: `${moduleConfig.name}/changeMobile` as 'changeMobile',
  mfa: `${moduleConfig.name}/mfa` as 'mfa',
  mfaModal: `${moduleConfig.name}/mfaModal` as 'mfaModal',
  discoveryClass: `${moduleConfig.name}/discovery-class` as 'discoveryClass',
};

export interface AuthNavigationTemplatesParams extends ParamListBase {
  onboarding: undefined;
  platforms: undefined;
}

export interface AuthNavigationParams extends ParamListBase {
  // Normal auth stack
  onboarding: AuthOnboardingScreenNavParams;
  platforms: AuthPlatformsScreenNavParams;
  accounts: AuthAccountSelectionScreenNavParams;
  loginCredentials: LoginCredentialsScreenNavParams;
  loginWayf: AuthLoginWayfScreenNavParams;
  loginRedirect: AuthLoginRedirectScreenNavParams;
  wayf: { platform: Platform; accountId?: string };
  activation: ActivationScreenNavParams;
  changePassword: ChangePasswordScreenNavParams;
  forgot: ForgotScreenNavParams;
  // Add account stack
  addAccountModal: AuthAddAccountModalScreenNavParams;
  addAccountOnboarding: AuthOnboardingAddAccountScreenNavParams;
  addAccountLoginCredentials: LoginCredentialsScreenNavParams;
  addAccountLoginWayf: AuthLoginWayfScreenNavParams;
  addAccountLoginRedirect: AuthLoginRedirectScreenNavParams;
  addAccountWayf: { platform: Platform };
  addAccountActivation: ActivationScreenNavParams;
  addAccountChangePassword: ChangePasswordScreenNavParams;
  addAccountForgot: ForgotScreenNavParams;
  // Exclusive logged screen
  revalidateTerms: object;
  changePasswordModal: ChangePasswordScreenNavParams;
  changeEmail: AuthChangeEmailScreenNavParams;
  changeMobile: AuthChangeMobileScreenNavParams;
  mfa: AuthMFAScreenNavParams;
  mfaModal: AuthMFAScreenNavParams;
  discoveryClass: AuthDiscoveryClassScreenNavParams;
}

/**
 * Simulate a nav action from the given nav state and returns the resulting nav state
 * @param action the nav action to simulate
 * @param state nav state (can be stale) to apply the nav action on
 * @returns The new nav State (will be rehydrated)
 */
export const simulateNavAction = (
  action: StackNavigationAction,
  state: Parameters<Router<StackNavigationState<ParamListBase>, StackNavigationAction>['getRehydratedState']>[0],
) => {
  // We must instaciate a throwaway StackRouter to perform the action on the state and get the resulting one.
  const router = StackRouter({});
  const routeNames = Object.values(authRouteNames);
  const rehydratedState = router.getRehydratedState(state, { routeNames, routeParamList: {}, routeGetIdList: {} });
  const newState = router.getStateForAction(rehydratedState, action, { routeNames, routeParamList: {}, routeGetIdList: {} });
  return newState ?? state;
};
