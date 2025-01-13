import * as React from 'react';

import { WikiNavigationParams, wikiRouteNames } from '.';

import moduleConfig from '~/framework/modules/wiki/module-config';
import WikiHomeScreen, { computeNavBar as homeNavBar } from '~/framework/modules/wiki/screens/home';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<WikiNavigationParams>(moduleConfig.name, Stack => (
    <>{<Stack.Screen name={wikiRouteNames.home} component={WikiHomeScreen} options={homeNavBar} initialParams={{}} />}</>
  ));
