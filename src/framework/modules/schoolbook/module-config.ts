import type { ISchoolbookState } from './reducer';

import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

export default new NavigableModuleConfig<'schoolbook', ISchoolbookState>({
  displayAs: 'myAppsModule',
  displayI18n: 'schoolbook-moduleconfig-tabname',
  displayPicture: { fill: theme.palette.complementary.green.regular, name: 'homeLiaisonDiary', type: 'Svg' },
  entcoreScope: ['schoolbook'],

  matchEntcoreApp: '/schoolbook',
  name: 'schoolbook',
  storageName: 'schoolbook',
});
