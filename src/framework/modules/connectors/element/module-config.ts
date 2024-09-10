import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'element', null>({
  name: 'element',
  entcoreScope: ['cas'],
  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('RIOT'),
  storageName: 'element',

  displayI18n: 'element-moduleconfig-appname',
  displayAs: 'myAppsConnector',
  displayPicture: { type: 'NamedSvg', name: 'element' },
});
