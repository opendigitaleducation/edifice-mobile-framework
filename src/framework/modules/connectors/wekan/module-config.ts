import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'wekan', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'wekan-moduleconfig-appname',
  displayPicture: { name: 'wekan', type: 'Svg' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('WEKAN'),
  name: 'wekan',
  storageName: 'wekan',
});
