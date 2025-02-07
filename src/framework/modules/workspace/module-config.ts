import type { IWorkspaceState } from './reducer';

import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'workspace', IWorkspaceState>({
  displayAs: 'myAppsModule',
  displayI18n: 'workspace-moduleconfig-modulename',
  displayPicture: { fill: theme.palette.complementary.red.regular, name: 'files', type: 'Svg' },
  entcoreScope: ['workspace'],

  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('ESPACE DOCUMENTAIRE'),
  name: 'workspace',
  storageName: 'workspace',
});
