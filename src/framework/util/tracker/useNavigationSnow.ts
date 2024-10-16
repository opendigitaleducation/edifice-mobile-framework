import type { Route } from '@react-navigation/native';
import * as React from 'react';
import { ThunkDispatch } from 'redux-thunk';

import { stopItSnowAction } from '~/framework/modules/user/actions';
import { navigationRef } from '~/framework/navigation/helper';

const customRouteNameLogicMap: { [key: string]: (route: Route<string, any>) => string } = {};

const stopSnowIfNeeded = async (
  dispatch: ThunkDispatch<any, any, any>,
  routeNameRef: React.MutableRefObject<string | undefined>,
  path?: string,
) => {
  const previousRouteName = routeNameRef.current;
  const route = navigationRef.getCurrentRoute();
  let currentRouteName = route?.name;

  if (route && currentRouteName && customRouteNameLogicMap[currentRouteName] !== undefined) {
    currentRouteName = customRouteNameLogicMap[currentRouteName](route);
  }

  if (currentRouteName && previousRouteName !== currentRouteName) {
    // Save the current route name for later comparison
    routeNameRef.current = currentRouteName;

    // Stop snowflakes when navigating
    (dispatch as ThunkDispatch<any, any, any>)(stopItSnowAction());
  }
};

export const useNavigationSnowHandler = (dispatch: ThunkDispatch<any, any, any>) => {
  const routeNameRef = React.useRef<string>();
  return () => stopSnowIfNeeded(dispatch, routeNameRef, navigationRef.getCurrentRoute()?.name);
};
