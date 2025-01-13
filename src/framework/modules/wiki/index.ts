import config from './module-config';
import getRoot from './navigation/navigator';
import setUpNotifHandlers from './notif-handler';

import { NavigableModule } from '~/framework/util/moduleTool';

module.exports = new NavigableModule({ config, getRoot, reducer: () => null });

setUpNotifHandlers();
