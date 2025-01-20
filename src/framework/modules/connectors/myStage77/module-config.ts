import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

const myStage77ConnectorAddress = 'https://mystage77.fr/s3e/sso';

function hasConnectorApp(entcoreApp: IEntcoreApp): boolean {
  return entcoreApp.address.includes(myStage77ConnectorAddress);
}

export default new NavigableModuleConfig<'https://mystage77.fr/s3e/sso', null>({
  displayAs: 'myAppsConnector',
  displayI18n: 'myStage77-moduleconfig-appname',
  displayPicture: { source: require('ASSETS/icons/moduleIcons/connector77.png'), type: 'Image' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => hasConnectorApp(entcoreApp),
  name: myStage77ConnectorAddress,
  storageName: myStage77ConnectorAddress,
});
