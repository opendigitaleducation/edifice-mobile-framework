import { NavigableModule } from '~/framework/util/moduleTool';

import config from './module-config';
import getRoot from './navigation/navigator';
import reducer from './reducer';

module.exports = new NavigableModule({ config, getRoot, reducer });
