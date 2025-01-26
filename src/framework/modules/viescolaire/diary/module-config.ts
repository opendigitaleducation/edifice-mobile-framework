import type { IDiaryReduxState } from './reducer';

import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return (
    !!userType &&
    entcoreApp.address === '/diary' &&
    [AccountType.Student, AccountType.Relative, AccountType.Teacher].includes(userType)
  );
}

export default new NavigableModuleConfig<'diary', IDiaryReduxState>({
  displayAs: 'myAppsSecondaryModule',
  displayI18n: 'diary-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.green.regular, name: 'diary', type: 'Svg' },
  entcoreScope: ['diary'],

  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  name: 'diary',
  storageName: 'diary',
});
