import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

const salvumConnectorAddress = 'https://cas.salvum.org/ent77-psc1';

function hasConnectorApp(entcoreApp: IEntcoreApp): boolean {
  return entcoreApp.address.includes(salvumConnectorAddress);
}

export default new NavigableModuleConfig<'https://cas.salvum.org/ent77-psc1', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'salvum-moduleconfig-appname',
  displayPicture: { source: require('ASSETS/icons/moduleIcons/salvum.png'), type: 'Image' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => hasConnectorApp(entcoreApp),
  name: salvumConnectorAddress,
  storageName: salvumConnectorAddress,
});
