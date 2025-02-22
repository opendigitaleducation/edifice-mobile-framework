import * as React from 'react';

import { FormNavigationParams, formRouteNames } from '.';

import moduleConfig from '~/framework/modules/form/module-config';
import FormDistributionScreen, { computeNavBar as distributionNavBar } from '~/framework/modules/form/screens/distribution';
import FormDistributionListScreen, {
  computeNavBar as distributionListNavBar,
} from '~/framework/modules/form/screens/distribution-list';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<FormNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen
        name={formRouteNames.home}
        component={FormDistributionListScreen}
        options={distributionListNavBar}
        initialParams={{}}
      />
      <Stack.Screen name={formRouteNames.distribution} component={FormDistributionScreen} options={distributionNavBar} />
    </>
  ));
