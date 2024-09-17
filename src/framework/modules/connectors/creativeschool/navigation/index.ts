import { ParamListBase } from '@react-navigation/native';

import type { ConnectorRedirectScreenNavParams } from '~/framework/modules/connectors/common/redirect-screen';
import moduleConfig from '~/framework/modules/connectors/creativeschool/module-config';

export const creativeschoolRouteNames = {
  home: `${moduleConfig.routeName}` as 'home',
};
export interface CreativeschoolNavigationParams extends ParamListBase {
  home: ConnectorRedirectScreenNavParams;
}
