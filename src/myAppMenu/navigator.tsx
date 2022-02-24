import I18n from 'i18n-js';
import * as React from 'react';
import { NavigationScreenProp } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import MyAppGrid from './components/MyAppGrid';
import { myAppsModules } from './myAppsModules';

import { AnyModule, NavigableModuleArray } from '~/framework/util/moduleTool';
import { IAppModule } from '~/infra/moduleTool/types';
import { getRoutes, getModules } from '~/navigation/helpers/navBuilder';
import { standardNavScreenOptions } from '~/navigation/helpers/navScreenOptions';

const MyAppGridContainer = (modules: IAppModule[], newModules: AnyModule[]) =>
  createStackNavigator({
    myAppsGrid: {
      screen: (props: any) => <MyAppGrid {...props} modules={modules} newModules={newModules} />,
    },
  }, {
    headerMode: 'none'
  });

export default (apps: any[]) => {
  const filter = (mod: IAppModule) => mod.config.hasRight(apps) && mod.config.group;
  const modules = getModules(filter);
  const newModules = new NavigableModuleArray(...myAppsModules.get().filterAvailables(apps));
  return createStackNavigator(
    {
      myApps: MyAppGridContainer(modules, newModules),
      ...getRoutes(modules),
      ...newModules.getRoutes(),
    },
    {
      headerMode: 'none',
    },
  );
};
