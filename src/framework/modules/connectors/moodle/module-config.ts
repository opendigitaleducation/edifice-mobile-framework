import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'moodle', null>({
  name: 'moodle',
  entcoreScope: ['cas'],
  matchEntcoreApp: '/moodle',
  storageName: 'moodle',

  displayI18n: 'moodle-moduleconfig-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'moodle' },
});
