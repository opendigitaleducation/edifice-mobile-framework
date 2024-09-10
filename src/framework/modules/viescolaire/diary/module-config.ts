import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

import type { IDiaryReduxState } from './reducer';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return (
    !!userType &&
    entcoreApp.address === '/diary' &&
    [AccountType.Student, AccountType.Relative, AccountType.Teacher].includes(userType)
  );
}

export default new NavigableModuleConfig<'diary', IDiaryReduxState>({
  name: 'diary',
  entcoreScope: ['diary'],
  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  storageName: 'diary',

  displayI18n: 'diary-moduleconfig-appname',
  displayAs: 'myAppsSecondaryModule',
  displayPicture: { type: 'NamedSvg', name: 'diary', fill: theme.palette.complementary.green.regular },
});
