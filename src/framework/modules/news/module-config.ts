import type { NewsState } from './reducer';

import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export const fillColor = appConf.is1d ? 'purple' : 'blue';
const fillApp = theme.palette.complementary[fillColor].regular;

export default new NavigableModuleConfig<'news', NewsState>({
  displayAs: 'myAppsModule',
  displayI18n: 'news-moduleconfig-tabname',
  displayPicture: { fill: fillApp, name: 'newsFeed', type: 'Svg' },
  entcoreScope: ['actualites'],

  matchEntcoreApp: '/actualites',
  name: 'news',
  storageName: 'news',
});
