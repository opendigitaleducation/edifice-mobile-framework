import type reducer from './reducers';

import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export const moduleColor = theme.palette.complementary[appConf.is1d ? 'blue' : 'green'];

export default new NavigableModuleConfig<'homework', ReturnType<typeof reducer>>({
  displayAs: 'myAppsModule',
  displayI18n: 'homework',
  displayPicture: { fill: moduleColor.regular, name: 'homework1D', type: 'Svg' },
  entcoreScope: ['homeworks'],

  matchEntcoreApp: '/homeworks',
  name: 'homework',
  storageName: 'homework',
});
