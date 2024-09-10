import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'creativeschool', null>({
  name: 'creativeschool',
  entcoreScope: ['cas'],
  matchEntcoreApp: entcoreApp => entcoreApp.name.includes('edifice'),
  storageName: 'creativeschool',

  displayI18n: 'creativeschool-moduleconfig-appname',
  displayAs: 'myAppsConnector',
  displayPicture: { type: 'Image', source: require('ASSETS/icons/moduleIcons/creativeschool.png') },
});
