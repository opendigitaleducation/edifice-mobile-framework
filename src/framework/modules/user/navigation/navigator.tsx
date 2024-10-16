import * as React from 'react';

import moduleConfig from '~/framework/modules/user/module-config';
import PushNotifsItemsListScreen, {
  computeNavBar as pushNotifsItemsListNavBar,
} from '~/framework/modules/user/screens/PushNotifsItemsListScreen';
import PushNotifsTopicsListScreen, {
  computeNavBar as pushNotifsTopicsListNavBar,
} from '~/framework/modules/user/screens/PushNotifsTopicsListScreen';
import {
  DetailedScreen,
  LogScreen,
  NetworkScreen,
  computeNavBar as debugNavBar,
  detailedNavBar,
  logNavBar,
} from '~/framework/modules/user/screens/debug';
import UserHomeScreen, { computeNavBar as homeNavBar } from '~/framework/modules/user/screens/home';
import UserLangScreen, { computeNavBar as langNavBar } from '~/framework/modules/user/screens/lang';
import UserLegalNoticeScreen, { computeNavBar as legalNoticeNavBar } from '~/framework/modules/user/screens/legal-notice';
import UserProfileScreen, { computeNavBar as profileNavBar } from '~/framework/modules/user/screens/profile';
import UserEditDescriptionScreen, {
  computeNavBar as editDescriptionNavBar,
} from '~/framework/modules/user/screens/profile/edit-description';
import UserEditHobbiesScreen, { computeNavBar as editHobbiesNavBar } from '~/framework/modules/user/screens/profile/edit-hobbies';
import UserEditMoodMottoScreen, {
  computeNavBar as editMoodMottoNavBar,
} from '~/framework/modules/user/screens/profile/edit-moodmotto';
import UserStructuresScreen, { computeNavBar as structuresNavBar } from '~/framework/modules/user/screens/profile/structures';
import UserWhoAreWeScreen, { computeNavBar as whoAreWeNavBar } from '~/framework/modules/user/screens/who-are-we';
import UserXmasScreen, { computeNavBar as xmasNavBar } from '~/framework/modules/user/screens/xmas';
import { setModalModeForRoutes } from '~/framework/navigation/hideTabBarAndroid';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';
import { IEntcoreApp, IEntcoreWidget } from '~/framework/util/moduleTool';

import { UserNavigationParams, userRouteNames } from './';

export default (apps: IEntcoreApp[], widgets: IEntcoreWidget[]) =>
  createModuleNavigator<UserNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen name={userRouteNames.detailed} component={DetailedScreen} options={detailedNavBar} initialParams={{}} />
      <Stack.Screen name={userRouteNames.log} component={LogScreen} options={logNavBar} initialParams={{}} />
      <Stack.Screen name={userRouteNames.network} component={NetworkScreen} options={debugNavBar} initialParams={{}} />
      <Stack.Screen name={userRouteNames.home} component={UserHomeScreen} options={homeNavBar} initialParams={{}} />
      <Stack.Screen name={userRouteNames.profile} component={UserProfileScreen} options={profileNavBar} initialParams={{}} />
      <Stack.Screen
        name={userRouteNames.notifPrefs}
        component={PushNotifsTopicsListScreen}
        options={pushNotifsTopicsListNavBar}
        initialParams={{}}
      />
      <Stack.Screen
        name={userRouteNames.legalNotice}
        component={UserLegalNoticeScreen}
        options={legalNoticeNavBar}
        initialParams={{}}
      />
      <Stack.Screen name={userRouteNames.lang} component={UserLangScreen} options={langNavBar} initialParams={{}} />
      <Stack.Screen name={userRouteNames.xmas} component={UserXmasScreen} options={xmasNavBar} initialParams={{}} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name={userRouteNames.notifPrefsDetails}
          component={PushNotifsItemsListScreen}
          options={pushNotifsItemsListNavBar}
          initialParams={{}}
        />
        <Stack.Screen name={userRouteNames.whoAreWe} component={UserWhoAreWeScreen} options={whoAreWeNavBar} initialParams={{}} />
        <Stack.Screen
          name={userRouteNames.structures}
          component={UserStructuresScreen}
          options={structuresNavBar}
          initialParams={{}}
        />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen
          name={userRouteNames.editHobbies}
          component={UserEditHobbiesScreen}
          options={editHobbiesNavBar}
          initialParams={{}}
        />
        <Stack.Screen
          name={userRouteNames.editDescription}
          component={UserEditDescriptionScreen}
          options={editDescriptionNavBar}
          initialParams={{}}
        />
        <Stack.Screen
          name={userRouteNames.editMoodMotto}
          component={UserEditMoodMottoScreen}
          options={editMoodMottoNavBar}
          initialParams={{}}
        />
      </Stack.Group>
    </>
  ));

setModalModeForRoutes([
  userRouteNames.notifPrefsDetails,
  userRouteNames.whoAreWe,
  userRouteNames.structures,
  userRouteNames.accountOnboarding,
  userRouteNames.editHobbies,
  userRouteNames.editDescription,
  userRouteNames.editMoodMotto,
  userRouteNames.space,
]);
