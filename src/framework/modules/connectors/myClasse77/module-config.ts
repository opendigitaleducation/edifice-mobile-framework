import { IEntcoreApp, NavigableModuleConfig } from '~/framework/util/moduleTool';

const myClass77ConnectorAddress =
  'https://myclasse77.v2.educlever.com/sso/stable/cas-myclasse77.php?casServer=https%3A%2F%2Fent77.seine-et-marne.fr%2Fcas&casVersion=2.0';

function hasConnectorApp(entcoreApp: IEntcoreApp): boolean {
  return entcoreApp.address.includes(myClass77ConnectorAddress);
}

export default new NavigableModuleConfig<
  'https://myclasse77.v2.educlever.com/sso/stable/cas-myclasse77.php?casServer=https%3A%2F%2Fent77.seine-et-marne.fr%2Fcas&casVersion=2.0',
  null
>({
  displayAs: 'myAppsConnector',
  displayI18n: 'myClasse77-moduleconfig-appname',
  displayPicture: { source: require('ASSETS/icons/moduleIcons/connector77.png'), type: 'Image' },
  entcoreScope: ['cas'],

  matchEntcoreApp: entcoreApp => hasConnectorApp(entcoreApp),
  name: myClass77ConnectorAddress,
  storageName: myClass77ConnectorAddress,
});
