import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'peertube', null>({
  name: 'peertube',
  entcoreScope: ['cas'],
  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('PEERTUBE'),
  storageName: 'peertube',

  displayI18n: 'peertube-moduleconfig-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'peertube', fill: theme.palette.complementary.red.regular },
});
