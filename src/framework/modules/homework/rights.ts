/**
 * Homework workflow
 */
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { getStore } from '~/app/store';
import { ISession } from '~/framework/modules/auth/model';
import { navigate } from '~/framework/navigation/helper';

import { fetchHomeworkDiaryList } from './actions/diaryList';
import { homeworkRouteNames } from './navigation';
import { registerTimelineWorkflow } from '../timeline/timeline-modules';

export const viewHomeworkResourceRight = 'fr.wseduc.homeworks.controllers.HomeworksController|view';
export const createHomeworkResourceRight = 'fr.wseduc.homeworks.controllers.HomeworksController|createHomework';

export const getHomeworkWorkflowInformation = (session: ISession) => ({
  view: session.authorizedActions.some(a => a.name === viewHomeworkResourceRight),
  create: session.authorizedActions.some(a => a.name === createHomeworkResourceRight),
});

export default () =>
  registerTimelineWorkflow(session => {
    const wk = getHomeworkWorkflowInformation(session);
    return (
      wk.create && {
        title: I18n.get('homework-resourcename'),
        action: async () => {
          await (getStore().dispatch as ThunkDispatch<any, any, any>)(fetchHomeworkDiaryList());
          const diaryList = getStore().getState().homework?.diaryList?.data;
          const diaryListIds = Object.getOwnPropertyNames(diaryList);
          const hasOneDiary = diaryListIds?.length === 1;
          if (hasOneDiary) {
            navigate(homeworkRouteNames.homeworkCreate);
          } else navigate(homeworkRouteNames.homeworkSelect);
        },
      }
    );
  });
