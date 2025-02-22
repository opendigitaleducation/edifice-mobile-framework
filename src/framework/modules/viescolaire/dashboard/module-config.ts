import type { IDashboardReduxState } from './reducer';

import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

function hasViescoApp(entcoreApp: IEntcoreApp): boolean {
  const apps = ['COMPETENCES', 'DIARY', 'EDT', 'PRESENCES'];
  return apps.includes(entcoreApp.name.toUpperCase());
}

export default new NavigableModuleConfig<'dashboard', IDashboardReduxState>({
  displayAs: 'tabModule',
  displayI18n: 'dashboard-moduleconfig-tabname',
  displayOrder: 2,
  displayPicture: { name: 'school', type: 'Icon' },
  entcoreScope: ['viescolaire'],

  hasRight: ({ session, matchingApps }) => matchingApps.length > 0 && session.platform.showVieScolaireDashboard === true,
  matchEntcoreApp: entcoreApp => hasViescoApp(entcoreApp),
  name: 'dashboard',
  storageName: 'dashboard',
});
