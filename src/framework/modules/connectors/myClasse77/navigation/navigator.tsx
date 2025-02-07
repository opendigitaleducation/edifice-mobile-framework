import * as React from 'react';

import { MyClasse77NavigationParams, myClasse77RouteNames } from '.';

import ConnectorRedirectScreen, { computeNavBar as homeNavBar } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/myClasse77/module-config';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<MyClasse77NavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={myClasse77RouteNames.home}
        component={ConnectorRedirectScreen}
        options={homeNavBar}
        initialParams={{
          url: 'https://myclasse77.v2.educlever.com/sso/stable/cas-myclasse77.php?casServer=https%3A%2F%2Fent77.seine-et-marne.fr%2Fcas&casVersion=2.0',
        }}
      />
    </>
  ));
