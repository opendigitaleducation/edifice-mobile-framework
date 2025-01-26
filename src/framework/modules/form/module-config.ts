import type { IFormReduxState } from './reducer';
import { getFormWorkflowInformation } from './rights';

import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'form', IFormReduxState>({
  displayAs: 'myAppsModule',
  displayI18n: 'form-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.purple.regular, name: 'form', type: 'Svg' },
  entcoreScope: ['formulaire'],
  hasRight: ({ session }) => !!getFormWorkflowInformation(session).initResponse,

  matchEntcoreApp: '/formulaire',
  name: 'form',
  storageName: 'form',
});
