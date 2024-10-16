import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'collaborativewall', null>({
  name: 'collaborativewall',
  entcoreScope: ['collaborativewall'],
  matchEntcoreApp: '/collaborativewall',
  storageName: 'collaborativewall',
  hasRight: (matchingApps, matchingWidgets) => appConf.isDevOrAlpha && matchingApps.length > 0, // Remove this line when this modules goes in production !

  displayI18n: 'collaborativewall-tabname',
});
