import * as React from 'react';

import { MyStage77NavigationParams, myStage77RouteNames } from '.';

import ConnectorRedirectScreen, { computeNavBar as homeNavBar } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/myStage77/module-config';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<MyStage77NavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={myStage77RouteNames.home}
        component={ConnectorRedirectScreen}
        options={homeNavBar}
        initialParams={{
          url: 'https://mystage77.fr/s3e/sso',
        }}
      />
    </>
  ));
