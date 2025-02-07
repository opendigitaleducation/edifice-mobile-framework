import { ParamListBase } from '@react-navigation/native';

import type { ConnectorRedirectScreenNavParams } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/salvum/module-config';

export const salvumRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
};
export interface SalvumNavigationParams extends ParamListBase {
  home: ConnectorRedirectScreenNavParams;
}
