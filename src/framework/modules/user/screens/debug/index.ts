import DetailedScreen from '~/framework/modules/user/screens/debug/log/detailed/screen';
import LogScreen from '~/framework/modules/user/screens/debug/log/screen';
import NetworkScreen from '~/framework/modules/user/screens/debug/network/screen';

import { DetailedScreenNavParams } from './log/detailed/types';
import { LogScreenNavParams } from './log/types';
import { NetworkScreenNavParams } from './network/types';

export { computeNavBar as detailedNavBar } from '~/framework/modules/user/screens/debug/log/detailed/screen';
export { computeNavBar as logNavBar } from '~/framework/modules/user/screens/debug/log/screen';
export { computeNavBar } from '~/framework/modules/user/screens/debug/network/screen';
export { DetailedScreen, LogScreen, NetworkScreen };

export type { DetailedScreenNavParams, LogScreenNavParams, NetworkScreenNavParams };
