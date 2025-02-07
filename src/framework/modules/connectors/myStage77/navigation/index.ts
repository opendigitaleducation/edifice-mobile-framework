import { ParamListBase } from '@react-navigation/native';

import type { ConnectorRedirectScreenNavParams } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/myStage77/module-config';

export const myStage77RouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
};
export interface MyStage77NavigationParams extends ParamListBase {
  home: ConnectorRedirectScreenNavParams;
}
