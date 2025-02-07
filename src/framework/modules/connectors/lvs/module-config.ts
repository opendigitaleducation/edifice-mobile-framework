import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

const LVSRegex = /la[- ]+vie[- ]+scolaire/i;
const LVSTestString = 'LVS';
function hasConnectorApp(entcoreApp: IEntcoreApp): boolean {
  return entcoreApp.address.toUpperCase().includes(LVSTestString) || LVSRegex.test(entcoreApp.address);
}

export default new NavigableModuleConfig<'lvs', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'lvs-moduleconfig-appname',
  displayPicture: { name: 'lvs', type: 'Svg' },
  entcoreScope: ['lvs'],

  matchEntcoreApp: entcoreApp => hasConnectorApp(entcoreApp),
  name: 'lvs',
  storageName: 'lvs',
});
