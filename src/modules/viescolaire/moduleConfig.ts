import { IViesco_State } from './reducer';

import { createNavigableModuleConfig } from '~/framework/util/moduleTool';

const ViescoApps = ['PRESENCES', 'INCIDENTS', 'DIARY'];

function hasViescoModule(entcoreApp) {
  const isModule = ViescoApps.findIndex(app => app === entcoreApp.name.toUpperCase());
  if (isModule && isModule !== -1) return true;
  return false;
}

export default createNavigableModuleConfig<'viescolaire', IViesco_State>({
  name: 'viescolaire',
  displayName: 'viesco',
  matchEntcoreApp: entcoreApp => hasViescoModule(entcoreApp),
  entcoreScope: ['viescolaire'],
  iconName: 'school',
  registerAs: 'tabModule',
  registerOrder: 2,
});
