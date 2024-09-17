import { ModuleConfig } from '~/framework/util/moduleTool';

export default new ModuleConfig<'audience', null>({
  name: 'audience',
  entcoreScope: ['audience'],
  matchEntcoreApp: () => false,
  hasRight: () => true,
  storageName: 'audience',
});
