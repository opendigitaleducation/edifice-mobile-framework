import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'wekan', null>({
  name: 'wekan',
  entcoreScope: ['cas'],
  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('WEKAN'),
  storageName: 'wekan',

  displayI18n: 'wekan-moduleconfig-appname',
  displayAs: 'myAppsConnector',
  displayPicture: { type: 'NamedSvg', name: 'wekan' },
});
