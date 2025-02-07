import type { ICompetencesReduxState } from './reducer';

import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return !!userType && entcoreApp.address === '/competences' && [AccountType.Student, AccountType.Relative].includes(userType);
}

export default new NavigableModuleConfig<'competences', ICompetencesReduxState>({
  displayAs: 'myAppsSecondaryModule',
  displayI18n: 'competences-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.red.regular, name: 'competences', type: 'Svg' },
  entcoreScope: ['competences'],

  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  name: 'competences',
  storageName: 'competences',
});
