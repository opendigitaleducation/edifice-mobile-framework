import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'element', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'element-moduleconfig-appname',
  displayPicture: { name: 'element', type: 'Svg' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('RIOT'),
  name: 'element',
  storageName: 'element',
});
