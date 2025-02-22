import * as React from 'react';

import { CompetencesNavigationParams, competencesRouteNames } from '.';

import moduleConfig from '~/framework/modules/viescolaire/competences/module-config';
import CompetencesAssessmentScreen, {
  computeNavBar as assessmentNavBar,
} from '~/framework/modules/viescolaire/competences/screens/assessment';
import CompetencesHomeScreen, { computeNavBar as homeNavBar } from '~/framework/modules/viescolaire/competences/screens/home';
import { createModuleNavigator } from '~/framework/navigation/moduleScreens';

export default () =>
  createModuleNavigator<CompetencesNavigationParams>(moduleConfig.name, Stack => (
    <>
      <Stack.Screen name={competencesRouteNames.home} component={CompetencesHomeScreen} options={homeNavBar} initialParams={{}} />
      <Stack.Screen
        name={competencesRouteNames.assessment}
        component={CompetencesAssessmentScreen}
        options={assessmentNavBar}
        initialParams={{}}
      />
    </>
  ));
