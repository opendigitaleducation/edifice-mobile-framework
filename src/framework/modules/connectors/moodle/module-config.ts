import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'moodle', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'moodle-moduleconfig-appname',
  displayPicture: { name: 'moodle', type: 'Svg' },
  entcoreScope: ['cas'],

  matchEntcoreApp: '/moodle',
  name: 'moodle',
  storageName: 'moodle',
});
