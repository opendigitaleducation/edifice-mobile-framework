import { ParamListBase } from '@react-navigation/native';

import moduleConfig from '~/framework/modules/wiki/module-config';
import type { WikiHomeScreenNavParams } from '~/framework/modules/wiki/screens/home';

export const wikiRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
};
export interface WikiNavigationParams extends ParamListBase {
  home: WikiHomeScreenNavParams;
}
