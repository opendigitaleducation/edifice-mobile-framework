import * as React from 'react';

import ConnectorRedirectScreen, { computeNavBar as homeNavBar } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/creativeschool/module-config';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';
import { IEntcoreApp, IEntcoreWidget } from '~/framework/util/moduleTool';

import { CreativeschoolNavigationParams, creativeschoolRouteNames } from '.';

export default (apps: IEntcoreApp[], widgets: IEntcoreWidget[]) =>
  createModuleNavigator<CreativeschoolNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={creativeschoolRouteNames.home}
        component={ConnectorRedirectScreen}
        options={homeNavBar}
        initialParams={{
          url: 'https://console.creativesnippet.com/school/scripts/oauth.php',
        }}
      />
    </>
  ));
