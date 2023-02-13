import theme from '~/app/theme';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import { ISchoolbookState } from './reducer';

export default new NavigableModuleConfig<'schoolbook', ISchoolbookState>({
  name: 'schoolbook',
  entcoreScope: ['schoolbook'],
  matchEntcoreApp: '/schoolbook',

  displayI18n: 'schoolbook.tabName',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'homeLiaisonDiary', fill: theme.palette.complementary.green.regular },
});
