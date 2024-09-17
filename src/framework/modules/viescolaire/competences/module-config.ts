import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

import type { ICompetencesReduxState } from './reducer';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return !!userType && entcoreApp.address === '/competences' && [AccountType.Student, AccountType.Relative].includes(userType);
}

export default new NavigableModuleConfig<'competences', ICompetencesReduxState>({
  name: 'competences',
  entcoreScope: ['competences'],
  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  storageName: 'competences',

  displayI18n: 'competences-moduleconfig-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'competences', fill: theme.palette.complementary.red.regular },
});
