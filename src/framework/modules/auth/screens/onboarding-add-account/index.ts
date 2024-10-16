import AuthOnboardingAddAccountScreen from './screen';

export default AuthOnboardingAddAccountScreen;
export type { AuthOnboardingAddAccountScreenNavParams, AuthOnboardingAddAccountScreenProps } from './types';
export { computeNavBar } from './screen';

// @scaffolder add other exports here

// ToDo !!
// These extra steps must be done manually :
//
//
// 1. Add these lines to src/framework/modules/auth/navigation/index.ts :
//
// import type { AuthOnboardingAddAccountScreenNavParams } from '~/framework/modules/auth/screens/onboarding-add-account';
//
// // in authRouteNames :
// onboardingAddAccount: `${moduleConfig.routeName}/onboarding-add-account` as 'onboardingAddAccount',
//
// // in interface AuthNavigationParams :
// onboardingAddAccount: AuthOnboardingAddAccountScreenNavParams;
//
//
// 2. Add these lines to src/framework/modules/auth/navigation/navigator.tsx :
//
// import AuthOnboardingAddAccountScreen, { computeNavBar as onboardingAddAccountNavBar } from '~/framework/modules/auth/screens/onboarding-add-account';
//
// // in createModuleNavigator() :
// <Stack.Screen
//   name={authRouteNames.onboardingAddAccount}
//   component={AuthOnboardingAddAccountScreen}
//   options={onboardingAddAccountNavBar}
//   initialParams={{}} // @scaffolder replace `{}` by `undefined` if no navParams are defined for this screen.
// />
//
// 3. Delete this comment.
//
