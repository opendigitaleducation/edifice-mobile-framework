import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export const displayColor = appConf.is1d ? theme.palette.complementary.red : theme.palette.complementary.purple;

export default new NavigableModuleConfig<'wiki', null>({
  displayAs: 'myAppsModule',
  displayI18n: 'wiki-module-title',
  displayOrder: 0,
  displayPicture: { fill: displayColor.regular, name: 'wiki', type: 'NamedSvg' },
  entcoreScope: ['wiki'],
  matchEntcoreApp: '/wiki',
  name: 'wiki',
  storageName: 'wiki',
});
