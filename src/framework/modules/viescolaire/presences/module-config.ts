import type { PresencesReduxState } from './reducer';

import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return (
    !!userType &&
    entcoreApp.address === '/presences' &&
    [AccountType.Student, AccountType.Relative, AccountType.Teacher].includes(userType)
  );
}

export default new NavigableModuleConfig<'presences', PresencesReduxState>({
  displayAs: 'myAppsModule',
  displayI18n: 'presences-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.yellow.regular, name: 'presences', type: 'Svg' },
  entcoreScope: ['presences'],

  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  name: 'presences',
  storageName: 'presences',
});
