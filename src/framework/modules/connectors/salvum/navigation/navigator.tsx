import * as React from 'react';

import { SalvumNavigationParams, salvumRouteNames } from '.';

import ConnectorRedirectScreen, { computeNavBar as homeNavBar } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/salvum/module-config';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<SalvumNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={salvumRouteNames.home}
        component={ConnectorRedirectScreen}
        options={homeNavBar}
        initialParams={{
          url: 'https://cas.salvum.org/ent77-psc1',
        }}
      />
    </>
  ));
