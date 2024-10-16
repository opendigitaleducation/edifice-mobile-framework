import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/user/module-config';
import type { IPushNotifsItemsListScreenNavigationParams } from '~/framework/modules/user/screens/PushNotifsItemsListScreen';
import type { IPushNotifsTopicsListScreenNavigationParams } from '~/framework/modules/user/screens/PushNotifsTopicsListScreen';
import { DetailedScreenNavParams, LogScreenNavParams, NetworkScreenNavParams } from '~/framework/modules/user/screens/debug/';
import type { UserHomeScreenNavParams } from '~/framework/modules/user/screens/home';
import type { UserLangScreenNavParams } from '~/framework/modules/user/screens/lang/types';
import type { UserLegalNoticeScreenNavParams } from '~/framework/modules/user/screens/legal-notice';
import type { ProfileScreenNavigationParams } from '~/framework/modules/user/screens/profile';
import type { UserEditDescriptionScreenNavParams } from '~/framework/modules/user/screens/profile/edit-description';
import type { UserEditHobbiesScreenNavParams } from '~/framework/modules/user/screens/profile/edit-hobbies';
import type { UserEditMoodMottoScreenNavParams } from '~/framework/modules/user/screens/profile/edit-moodmotto';
import type { UserStructuresScreenNavParams } from '~/framework/modules/user/screens/profile/structures';
import type { UserWhoAreWeScreenNavParams } from '~/framework/modules/user/screens/who-are-we';
import type { UserXmasScreenNavParams } from '~/framework/modules/user/screens/xmas';

export const userRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
  network: `${moduleConfig.routeName}/debug/network` as 'network',
  log: `${moduleConfig.routeName}/debug/log` as 'log',
  detailed: `${moduleConfig.routeName}/debug/log/detailed` as 'detailed',
  notifPrefs: `${moduleConfig.routeName}/notifPrefs` as 'notifPrefs',
  notifPrefsDetails: `${moduleConfig.routeName}/notifPrefs/details` as 'notifPrefsDetails',
  profile: `${moduleConfig.routeName}/profile` as 'profile',
  structures: `${moduleConfig.routeName}/profile/structures` as 'structures',
  editHobbies: `${moduleConfig.routeName}/profile/editHobbies` as 'editHobbies',
  editDescription: `${moduleConfig.routeName}/profile/editDescription` as 'editDescription',
  editMoodMotto: `${moduleConfig.routeName}/profile/editMoodMotto` as 'editMoodMotto',
  whoAreWe: `${moduleConfig.routeName}/who-are-we` as 'whoAreWe',
  xmas: `${moduleConfig.routeName}/xmas` as 'xmas',
  legalNotice: `${moduleConfig.routeName}/legal-notice` as 'legalNotice',
  lang: `${moduleConfig.routeName}/lang` as 'lang',
};
export interface UserNavigationParams extends ParamListBase {
  network: NetworkScreenNavParams;
  log: LogScreenNavParams;
  detailed: DetailedScreenNavParams;
  home: UserHomeScreenNavParams;
  notifPrefs: IPushNotifsTopicsListScreenNavigationParams;
  notifPrefsDetails: IPushNotifsItemsListScreenNavigationParams;
  profile: ProfileScreenNavigationParams;
  structures: UserStructuresScreenNavParams;
  editHobbies: UserEditHobbiesScreenNavParams;
  editDescription: UserEditDescriptionScreenNavParams;
  editMoodMotto: UserEditMoodMottoScreenNavParams;
  whoAreWe: UserWhoAreWeScreenNavParams;
  xmas: UserXmasScreenNavParams;
  legalNotice: UserLegalNoticeScreenNavParams;
  lang: UserLangScreenNavParams;
}
