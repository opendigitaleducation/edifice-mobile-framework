import { ParamListBase } from '@react-navigation/native';

import type { ConnectorRedirectScreenNavParams } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/myClasse77/module-config';

export const myClasse77RouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
};
export interface MyClasse77NavigationParams extends ParamListBase {
  home: ConnectorRedirectScreenNavParams;
}
