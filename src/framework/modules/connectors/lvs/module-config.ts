import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

const LVSRegex = /la[- ]+vie[- ]+scolaire/i;
const LVSTestString = 'LVS';
function hasConnectorApp(entcoreApp: IEntcoreApp): boolean {
  return entcoreApp.address.toUpperCase().includes(LVSTestString) || LVSRegex.test(entcoreApp.address);
}

export default new NavigableModuleConfig<'lvs', null>({
  name: 'lvs',
  entcoreScope: ['lvs'],
  matchEntcoreApp: entcoreApp => hasConnectorApp(entcoreApp),
  storageName: 'lvs',

  displayI18n: 'lvs-moduleconfig-appname',
  displayAs: 'myAppsConnector',
  displayPicture: { type: 'NamedSvg', name: 'lvs' },
});
