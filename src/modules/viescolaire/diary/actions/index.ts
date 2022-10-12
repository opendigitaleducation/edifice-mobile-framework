/**
 * Diary actions
 */
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { getUserSession } from '~/framework/util/session';
import { createAsyncActionCreators } from '~/infra/redux/async2';
import { IHomeworkMap, ISession, actionTypes } from '~/modules/viescolaire/diary/reducer';
import { diaryService } from '~/modules/viescolaire/diary/service';
import { ISlot } from '~/modules/viescolaire/edt/reducer';
import { edtService } from '~/modules/viescolaire/edt/service';

/**
 * Fetch the homeworks from a structure.
 */
export const diaryHomeworksActionsCreators = createAsyncActionCreators(actionTypes.homeworks);
export const fetchDiaryHomeworksAction =
  (structureId: string, startDate: string, endDate: string): ThunkAction<Promise<IHomeworkMap>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(diaryHomeworksActionsCreators.request());
      const homeworkMap = await diaryService.homeworks.get(session, structureId, startDate, endDate);
      dispatch(diaryHomeworksActionsCreators.receipt(homeworkMap));
      return homeworkMap;
    } catch (e) {
      dispatch(diaryHomeworksActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the homeworks from a child.
 */
export const fetchDiaryHomeworksFromChildAction =
  (childId: string, structureId: string, startDate: string, endDate: string): ThunkAction<Promise<IHomeworkMap>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(diaryHomeworksActionsCreators.request());
      const homeworkMap = await diaryService.homeworks.getFromChild(session, childId, structureId, startDate, endDate);
      dispatch(diaryHomeworksActionsCreators.receipt(homeworkMap));
      return homeworkMap;
    } catch (e) {
      dispatch(diaryHomeworksActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Update the progress of a specific homework.
 */
export const diaryUpdateHomeworkActionsCreators = createAsyncActionCreators(actionTypes.updateHomework);
export const updateDiaryHomeworkProgressAction =
  (homeworkId: number, isDone: boolean) => async (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
    try {
      const session = getUserSession();
      dispatch(diaryUpdateHomeworkActionsCreators.request());
      const result = await diaryService.homework.updateProgress(session, homeworkId, isDone);
      dispatch(diaryUpdateHomeworkActionsCreators.receipt(result));
    } catch (e) {
      dispatch(diaryUpdateHomeworkActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the sessions from a structure.
 */
export const diarySessionsActionsCreators = createAsyncActionCreators(actionTypes.sessions);
export const fetchDiarySessionsAction =
  (structureId: string, startDate: string, endDate: string): ThunkAction<Promise<ISession[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(diarySessionsActionsCreators.request());
      const sessions = await diaryService.sessions.get(session, structureId, startDate, endDate);
      dispatch(diarySessionsActionsCreators.receipt(sessions));
      return sessions;
    } catch (e) {
      dispatch(diarySessionsActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the sessions from a child.
 */
export const fetchDiarySessionsFromChildAction =
  (childId: string, startDate: string, endDate: string): ThunkAction<Promise<ISession[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(diarySessionsActionsCreators.request());
      const sessions = await diaryService.sessions.getFromChild(session, childId, startDate, endDate);
      dispatch(diarySessionsActionsCreators.receipt(sessions));
      return sessions;
    } catch (e) {
      dispatch(diarySessionsActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the time slots.
 */
export const diarySlotsActionsCreators = createAsyncActionCreators(actionTypes.slots);
export const fetchDiarySlotsAction =
  (structureId: string): ThunkAction<Promise<ISlot[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(diarySlotsActionsCreators.request());
      const slots = await edtService.slots.get(session, structureId);
      dispatch(diarySlotsActionsCreators.receipt(slots));
      return slots;
    } catch (e) {
      dispatch(diarySlotsActionsCreators.error(e as Error));
      throw e;
    }
  };