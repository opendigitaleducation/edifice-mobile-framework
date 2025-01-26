import type reducer from './reducer';

import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export const moduleColor = appConf.is1d ? theme.palette.complementary.orange : theme.palette.complementary.indigo;

export default new NavigableModuleConfig<'blog', ReturnType<typeof reducer>>({
  displayAs: 'myAppsModule',
  displayI18n: 'blog-tabname',
  displayPicture: { fill: moduleColor.regular, name: 'blog', type: 'Svg' },
  entcoreScope: ['blog'],

  matchEntcoreApp: '/blog',
  name: 'blog',
  storageName: 'blog',
});
