/**
 * A specific moduleMap that exists inside myAppMenu
 */
import { ModuleRegister, UnknownNavigableModule, setGlobalRegister } from '~/framework/util/moduleTool';

// myApps module register =========================================================================

export const myAppsModules = new ModuleRegister<UnknownNavigableModule>();
export const myAppsSecondaryModules = new ModuleRegister<UnknownNavigableModule>();
export const myAppsConnector = new ModuleRegister<UnknownNavigableModule>();

setGlobalRegister('myAppsModule', myAppsModules);
setGlobalRegister('myAppsSecondaryModule', myAppsSecondaryModules);
setGlobalRegister('myAppsConnector', myAppsConnector);
