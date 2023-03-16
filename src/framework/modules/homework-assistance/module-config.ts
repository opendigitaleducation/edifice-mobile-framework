import theme from '~/app/theme';
import { assertSession } from '~/framework/modules/auth/reducer';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import reducer from './reducer';
import { getHomeworkAssistanceWorkflowInformation } from './rights';

export default new NavigableModuleConfig<'homeworkAssistance', ReturnType<typeof reducer>>({
  name: 'homeworkAssistance',
  entcoreScope: ['homework-assistance'],
  matchEntcoreApp: '/homework-assistance',
  hasRight: () => getHomeworkAssistanceWorkflowInformation(assertSession()).send,

  displayI18n: 'homeworkAssistance.tabName',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'homeworkAssistance', fill: theme.palette.complementary.indigo.regular },
});