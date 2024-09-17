import { NavigableModule } from '~/framework/util/moduleTool';

import config from './module-config';
import getRoot from './navigation/navigator';

module.exports = new NavigableModule({ config, getRoot, reducer: () => null });
