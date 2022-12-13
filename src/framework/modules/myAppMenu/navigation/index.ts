import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '../moduleConfig';

export const myAppsRouteNames = {
  Home: `${moduleConfig.routeName}` as 'Home',
};
export interface IMyAppsNavigationParams extends ParamListBase {
  Home: undefined;
}
