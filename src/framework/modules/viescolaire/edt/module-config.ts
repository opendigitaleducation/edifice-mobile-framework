import type { IEdtReduxState } from './reducer';

import theme from '~/app/theme';
import { AccountType } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

function hasNecessaryRight(entcoreApp: IEntcoreApp): boolean {
  const userType = getSession()?.user.type;
  return (
    !!userType &&
    entcoreApp.address === '/edt' &&
    [AccountType.Student, AccountType.Relative, AccountType.Teacher].includes(userType)
  );
}

export default new NavigableModuleConfig<'edt', IEdtReduxState>({
  displayAs: 'myAppsModule',
  displayI18n: 'edt-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.indigo.regular, name: 'edt', type: 'Svg' },
  entcoreScope: ['edt'],

  matchEntcoreApp: entcoreApp => hasNecessaryRight(entcoreApp),
  name: 'edt',
  storageName: 'edt',
});
