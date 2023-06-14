import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import { NewsState } from './reducer';

const fillApp = appConf.is1d ? theme.palette.complementary.purple.regular : theme.palette.primary.regular;

export default new NavigableModuleConfig<'newsv2', NewsState>({
  name: 'newsv2',
  entcoreScope: ['actualites'],
  matchEntcoreApp: '/actualites',
  displayI18n: 'news-tabName',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'newsFeed', fill: fillApp },
});
