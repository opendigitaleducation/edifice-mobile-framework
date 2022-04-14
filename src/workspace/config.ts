import FunctionalModuleConfig from '~/infra/moduleTool';


export default new FunctionalModuleConfig({
  name: 'workspace',
  apiName: 'Espace documentaire',
  displayName: 'workspace',
  picture: { type: 'NamedSvg', name: 'files' },
  group: true,
  notifHandlerFactory: async () => {
    //must lazy load to avoid compile errors
    const res = await import('./notifHandler');
    const val: any = res.default;
    //sometime dynamic import include default in default
    if (val.default) {
      return val.default;
    } else {
      return val;
    }
  },
  blacklistFolders: ['edumedia'],
});