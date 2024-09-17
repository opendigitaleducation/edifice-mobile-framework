import theme from '~/app/theme';
import { getSession } from '~/framework/modules/auth/reducer';
import { NavigableModuleConfig } from '~/framework/util/moduleTool';

import type { IHomeworkAssistanceReduxState } from './reducer';
import { getHomeworkAssistanceWorkflowInformation } from './rights';

export default new NavigableModuleConfig<'homeworkAssistance', IHomeworkAssistanceReduxState>({
  name: 'homeworkAssistance',
  entcoreScope: ['homework-assistance'],
  matchEntcoreApp: '/homework-assistance',
  hasRight: () => {
    const session = getSession();
    return !!session && !!getHomeworkAssistanceWorkflowInformation(session).send;
  },
  storageName: 'homeworkAssistance',

  displayI18n: 'homeworkassistance-appname',
  displayAs: 'myAppsModule',
  displayPicture: { type: 'NamedSvg', name: 'homeworkAssistance', fill: theme.palette.complementary.indigo.regular },
});
