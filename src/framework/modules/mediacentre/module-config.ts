import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import type { MediacentreReduxState } from './reducer';

export default new NavigableModuleConfig<'mediacentre', MediacentreReduxState>({
  name: 'mediacentre',
  entcoreScope: ['mediacentre'],
  matchEntcoreApp: '/mediacentre',
  storageName: 'mediacentre',

  displayI18n: 'mediacentre-moduleconfig-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'mediacentre' },
});
