import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'scrapbook', null>({
  displayAs: 'myAppsModule',
  displayI18n: 'scrapbook-appname',
  displayOrder: 0,
  displayPicture: { fill: theme.palette.complementary.green.regular, name: 'scrapbook', type: 'Svg' },

  entcoreScope: ['scrapbook'],
  matchEntcoreApp: '/scrapbook',
  name: 'scrapbook',
  storageName: 'scrapbook',
});
