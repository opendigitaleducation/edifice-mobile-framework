import { createNavigableModuleConfig } from '~/framework/util/moduleTool';

import { IMediacentre_State } from './reducer';

export default createNavigableModuleConfig<'Mediacentre', IMediacentre_State>({
  name: 'Mediacentre',
  displayName: 'mediacentre.mediacentre',
  matchEntcoreApp: entcoreApp => entcoreApp.name.toUpperCase().includes('MEDIACENTRE'),
  entcoreScope: ['mediacentre'],
  picture: {
    type: 'NamedSvg',
    name: 'mediacentre',
  },
  registerAs: 'myAppsModule',
});
