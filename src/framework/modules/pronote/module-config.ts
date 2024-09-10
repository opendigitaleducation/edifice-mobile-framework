import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import type reducer from './reducer';

export default new NavigableModuleConfig<'pronote', ReturnType<typeof reducer>>({
  name: 'pronote',
  entcoreScope: ['pronote'],
  matchEntcoreApp: entcoreApp => entcoreApp.casType === 'PronoteRegisteredService',
  matchEntcoreWidget: entcoreWidget => entcoreWidget.name === 'carnet-de-bord',
  storageName: 'pronote',

  displayI18n: (matchingApps, matchingWidgets) => {
    return matchingWidgets.length > 0 ? 'carnetdebord' : 'pronote';
  },
  displayAs: (matchingApps, matchingWidgets) => (matchingWidgets.length > 0 ? 'myAppsSecondaryModule' : 'myAppsConnector'),
  displayPicture: { type: 'Image', source: require('ASSETS/images/logo-pronote.png') },
});
