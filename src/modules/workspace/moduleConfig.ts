import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import { IWorkspace_State } from './reducer';

export default new NavigableModuleConfig<'workspace', IWorkspace_State>({
  name: 'workspace',
  entcoreScope: ['workspace'],
  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('ESPACE DOCUMENTAIRE'),

  displayI18n: 'workspace.tabName',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'files', fill: theme.palette.complementary.red.regular },
});