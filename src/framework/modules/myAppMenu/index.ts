import { NavigableModule } from '~/framework/util/moduleTool';

import config from './module-config';
import getRoot from './navigation/navigator';
import { storage } from './storage';

const reducer = () => null;

module.exports = new NavigableModule({ config, getRoot, reducer, storage });
