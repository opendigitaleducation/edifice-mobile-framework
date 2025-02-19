import { ModuleConfig } from '~/framework/util/moduleTool';

export default new ModuleConfig<'explorer', null>({
  entcoreScope: ['explorer'],
  hasRight: () => true,
  matchEntcoreApp: '/explorer',
  name: 'explorer',
  storageName: 'explorer',
});
