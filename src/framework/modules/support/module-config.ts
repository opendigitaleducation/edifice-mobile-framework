import type reducer from './reducer';

import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'support', ReturnType<typeof reducer>>({
  displayAs: 'myAppsSecondaryModule',
  displayI18n: 'support-appname',
  displayPicture: { fill: theme.palette.complementary.green.regular, name: 'support', type: 'Svg' },
  entcoreScope: ['support'],

  matchEntcoreApp: '/support',
  name: 'support',
  storageName: 'support',
});
