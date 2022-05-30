import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import { ISupport_State } from './reducer';

export default new NavigableModuleConfig<'support', ISupport_State>({
  name: 'support',
  entcoreScope: ['support'],
  matchEntcoreApp: '/support',

  displayI18n: 'support',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'support', fill: theme.themeOpenEnt.pink },
});
