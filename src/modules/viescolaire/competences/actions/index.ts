/**
 * Competences actions
 */
import { ThunkAction } from 'redux-thunk';

import { getUserSession } from '~/framework/util/session';
import { createAsyncActionCreators } from '~/infra/redux/async2';
import { IDevoirsMatieres, ILevel, IMoyenne, IUserChild, actionTypes } from '~/modules/viescolaire/competences/reducer';
import { competencesService } from '~/modules/viescolaire/competences/service';

/**
 * Fetch the homeworks.
 */
export const competencesDevoirsActionsCreators = createAsyncActionCreators(actionTypes.devoirsMatieres);
export const fetchCompetencesDevoirsAction =
  (structureId: string, eleve: string, periods?: string, matiere?: string): ThunkAction<Promise<IDevoirsMatieres>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      dispatch(competencesDevoirsActionsCreators.clear());
      const session = getUserSession();
      dispatch(competencesDevoirsActionsCreators.request());
      const devoirs = await competencesService.devoirs.get(session, structureId, eleve, periods, matiere);
      dispatch(competencesDevoirsActionsCreators.receipt(devoirs));
      return devoirs;
    } catch (e) {
      dispatch(competencesDevoirsActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the levels.
 */
export const competencesLevelsActionsCreators = createAsyncActionCreators(actionTypes.levels);
export const fetchCompetencesLevelsAction =
  (structureId: string): ThunkAction<Promise<ILevel[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      dispatch(competencesLevelsActionsCreators.clear());
      const session = getUserSession();
      dispatch(competencesLevelsActionsCreators.request());
      const levels = await competencesService.levels.get(session, structureId);
      dispatch(competencesLevelsActionsCreators.receipt(levels));
      return levels;
    } catch (e) {
      dispatch(competencesLevelsActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the grades.
 */
export const competencesMoyennesActionsCreators = createAsyncActionCreators(actionTypes.moyennes);
export const fetchCompetencesMoyennesAction =
  (structureId: string, studentId: string, periodId?: string): ThunkAction<Promise<IMoyenne[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      dispatch(competencesMoyennesActionsCreators.clear());
      const session = getUserSession();
      dispatch(competencesMoyennesActionsCreators.request());
      const moyennes = await competencesService.moyennes.get(session, structureId, studentId, periodId);
      dispatch(competencesMoyennesActionsCreators.receipt(moyennes));
      return moyennes;
    } catch (e) {
      dispatch(competencesMoyennesActionsCreators.error(e as Error));
      throw e;
    }
  };

/**
 * Fetch the user children.
 */
export const competencesUserChildrenActionsCreators = createAsyncActionCreators(actionTypes.userChildren);
export const fetchCompetencesUserChildrenAction =
  (relativeId: string): ThunkAction<Promise<IUserChild[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = getUserSession();
      dispatch(competencesUserChildrenActionsCreators.request());
      const userChildren = await competencesService.userChildren.get(session, relativeId);
      dispatch(competencesUserChildrenActionsCreators.receipt(userChildren));
      return userChildren;
    } catch (e) {
      dispatch(competencesUserChildrenActionsCreators.error(e as Error));
      throw e;
    }
  };