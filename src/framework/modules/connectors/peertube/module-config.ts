import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'peertube', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'peertube-moduleconfig-appname',
  displayPicture: { fill: theme.palette.complementary.red.regular, name: 'peertube', type: 'Svg' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('PEERTUBE'),
  name: 'peertube',
  storageName: 'peertube',
});
