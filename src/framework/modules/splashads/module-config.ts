import { ModuleConfig } from '~/framework/util/moduleTool';

export default new ModuleConfig<'splashads', null>({
  name: 'splashads',
  entcoreScope: ['splashads'],
  matchEntcoreApp: () => false,
  hasRight: () => true,
  storageName: 'splashads',
});
