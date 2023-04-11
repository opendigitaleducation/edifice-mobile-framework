import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/user/module-config';
import { IPushNotifsItemsListScreenNavigationParams } from '~/framework/modules/user/screens/PushNotifsItemsListScreen';
import type { IPushNotifsTopicsListScreenNavigationParams } from '~/framework/modules/user/screens/PushNotifsTopicsListScreen';
import type { UserFamilyScreenNavParams } from '~/framework/modules/user/screens/family';
import type { UserHomeScreenNavParams } from '~/framework/modules/user/screens/home';
import type { UserLegalNoticeScreenNavParams } from '~/framework/modules/user/screens/legal-notice';
import type { ProfileScreenNavigationParams } from '~/framework/modules/user/screens/profile';
import type { UserStructuresScreenNavParams } from '~/framework/modules/user/screens/structures';
import type { UserWhoAreWeScreenNavParams } from '~/framework/modules/user/screens/who-are-we';

export const userRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
  notifPrefs: `${moduleConfig.routeName}/notifPrefs` as 'notifPrefs',
  notifPrefsDetails: `${moduleConfig.routeName}/notifPrefs/details` as 'notifPrefsDetails',
  profile: `${moduleConfig.routeName}/profile` as 'profile',
  structures: `${moduleConfig.routeName}/structures` as 'structures',
  family: `${moduleConfig.routeName}/family` as 'family',
  whoAreWe: `${moduleConfig.routeName}/who-are-we` as 'whoAreWe',
  legalNotice: `${moduleConfig.routeName}/legal-notice` as 'legalNotice',
};
export interface UserNavigationParams extends ParamListBase {
  home: UserHomeScreenNavParams;
  notifPrefs: IPushNotifsTopicsListScreenNavigationParams;
  notifPrefsDetails: IPushNotifsItemsListScreenNavigationParams;
  profile: ProfileScreenNavigationParams;
  structures: UserStructuresScreenNavParams;
  family: UserFamilyScreenNavParams;
  whoAreWe: UserWhoAreWeScreenNavParams;
  legalNotice: UserLegalNoticeScreenNavParams;
}
