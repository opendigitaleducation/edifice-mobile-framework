/**
 * Mediacentre actions
 */
import { ThunkAction } from 'redux-thunk';

import { assertSession } from '~/framework/modules/auth/reducer';
import { MediacentreResources, Resource, Source } from '~/framework/modules/mediacentre/model';
import { actionTypes } from '~/framework/modules/mediacentre/reducer';
import { actions as favoritesActions } from '~/framework/modules/mediacentre/reducer/favorites';
import { actions as selectedStructureActions } from '~/framework/modules/mediacentre/reducer/selectedStructure';
import { mediacentreService } from '~/framework/modules/mediacentre/service';
import { createAsyncActionCreators } from '~/framework/util/redux/async';

export const resourcesActionsCreators = createAsyncActionCreators(actionTypes.fetchResources);
export const fetchResourcesAction =
  (structureId: string): ThunkAction<Promise<MediacentreResources>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(resourcesActionsCreators.request());
      let [externals, pins, signets, textbooks] = await Promise.all([
        mediacentreService.search.getSimple(session, [Source.GAR], '.*'),
        mediacentreService.pins.get(session, structureId),
        mediacentreService.signets.get(session),
        mediacentreService.textbooks.get(session, structureId),
      ]);
      if (!externals.length) externals = await mediacentreService.globalResources.get(session);
      externals = externals.filter(r => !r.isTextbook);
      const resources = { externals, pins, signets, textbooks };
      dispatch(resourcesActionsCreators.receipt(resources));
      return resources;
    } catch (e) {
      dispatch(resourcesActionsCreators.error(e as Error));
      throw e;
    }
  };

export const searchActionsCreators = createAsyncActionCreators(actionTypes.search);
export const searchResourcesAction =
  (query: string): ThunkAction<Promise<Resource[]>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(searchActionsCreators.request());
      const resources = await mediacentreService.search.getSimple(session, [Source.GAR, Source.MOODLE, Source.SIGNET], query);
      dispatch(searchActionsCreators.receipt(resources));
      return resources;
    } catch (e) {
      dispatch(searchActionsCreators.error(e as Error));
      throw e;
    }
  };

// Favorites

export const fetchFavoritesAction = (): ThunkAction<Promise<Resource[]>, any, any, any> => async (dispatch, getState) => {
  try {
    const session = assertSession();
    dispatch(favoritesActions.request());
    const favorites = await mediacentreService.favorites.get(session);
    dispatch(favoritesActions.receipt(favorites));
    return favorites;
  } catch (e) {
    dispatch(favoritesActions.error(e as Error));
    throw e;
  }
};

export const addFavoriteAction =
  (resource: Resource): ThunkAction<Promise<void>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(favoritesActions.addRequest());
      await mediacentreService.favorites.add(session, resource);
      dispatch(favoritesActions.addReceipt(resource));
    } catch (e) {
      dispatch(favoritesActions.addError(e as Error));
      throw e;
    }
  };

export const removeFavoriteAction =
  (resource: Resource): ThunkAction<Promise<void>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(favoritesActions.removeRequest());
      await mediacentreService.favorites.remove(session, resource.id, resource.source);
      dispatch(favoritesActions.removeReceipt(resource));
    } catch (e) {
      dispatch(favoritesActions.removeError(e as Error));
      throw e;
    }
  };

// Selected structure

export const fetchSelectedStructureAction =
  (): ThunkAction<Promise<string | null>, any, any, any> => async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(selectedStructureActions.request());
      const id = await mediacentreService.selectedStructure.get(session);
      dispatch(selectedStructureActions.receipt(id));
      return id;
    } catch (e) {
      dispatch(selectedStructureActions.error(e as Error));
      throw e;
    }
  };

export const editSelectedStructureAction =
  (id: string): ThunkAction<Promise<void>, any, any, any> =>
  async (dispatch, getState) => {
    try {
      const session = assertSession();
      dispatch(selectedStructureActions.editRequest());
      await mediacentreService.selectedStructure.update(session, id);
      dispatch(selectedStructureActions.editReceipt(id));
    } catch (e) {
      dispatch(selectedStructureActions.editError(e as Error));
      throw e;
    }
  };
