import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import type reducer from './reducer';

export default new NavigableModuleConfig<'support', ReturnType<typeof reducer>>({
  name: 'support',
  entcoreScope: ['support'],
  matchEntcoreApp: '/support',
  storageName: 'support',

  displayI18n: 'support-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'support', fill: theme.palette.complementary.green.regular },
});
