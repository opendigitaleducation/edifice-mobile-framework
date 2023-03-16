import I18n from 'i18n-js';
import * as React from 'react';

import moduleConfig from '~/framework/modules/myAppMenu/moduleConfig';
import { myAppsModules } from '~/framework/modules/myAppMenu/myAppsModules';
import MyAppsHomeScreen from '~/framework/modules/myAppMenu/screens/MyAppsHomeScreen';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';
import { IEntcoreApp, IEntcoreWidget, NavigableModuleArray } from '~/framework/util/moduleTool';

import { IMyAppsNavigationParams, myAppsRouteNames } from '.';

export default (apps: IEntcoreApp[], widgets: IEntcoreWidget[]) => {
  const modules = new NavigableModuleArray(...myAppsModules.get().filterAvailables(apps, widgets));
  const MyAppsContainer = props => <MyAppsHomeScreen {...props} modules={modules} />;
  return createModuleNavigator<IMyAppsNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={myAppsRouteNames.Home}
        component={MyAppsContainer}
        options={{
          title: I18n.t('MyApplications'),
        }}
        initialParams={undefined}
      />
    </>
  ));
};