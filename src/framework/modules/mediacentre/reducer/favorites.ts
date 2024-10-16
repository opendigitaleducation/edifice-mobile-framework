import { Resource } from '~/framework/modules/mediacentre/model';
import moduleConfig from '~/framework/modules/mediacentre/module-config';
import {
  AsyncState,
  createAsyncActionCreators,
  createAsyncActionTypes,
  createSessionAsyncReducer,
} from '~/framework/util/redux/async';

export type FavoritesStateData = Resource[];
export type FavoritesState = AsyncState<FavoritesStateData>;

const initialState: FavoritesStateData = [];

export const actionTypes = {
  ...createAsyncActionTypes(moduleConfig.namespaceActionType('FAVORITES')),
  addRequest: moduleConfig.namespaceActionType('FAVORITE_ADD_REQUEST'),
  addReceipt: moduleConfig.namespaceActionType('FAVORITE_ADD_RECEIPT'),
  addError: moduleConfig.namespaceActionType('FAVORITE_ADD_ERROR'),
  removeRequest: moduleConfig.namespaceActionType('FAVORITE_REMOVE_REQUEST'),
  removeReceipt: moduleConfig.namespaceActionType('FAVORITE_REMOVE_RECEIPT'),
  removeError: moduleConfig.namespaceActionType('FAVORITE_REMOVE_ERROR'),
};
export const actions = {
  ...createAsyncActionCreators<FavoritesStateData>(actionTypes),
  addRequest: () => ({ type: actionTypes.addRequest }),
  addReceipt: (resource: Resource) => ({ type: actionTypes.addReceipt, resource }),
  addError: (error: Error) => ({ type: actionTypes.addError, error }),
  removeRequest: () => ({ type: actionTypes.removeRequest }),
  removeReceipt: (resource: Resource) => ({ type: actionTypes.removeReceipt, resource }),
  removeError: (error: Error) => ({ type: actionTypes.removeError, error }),
};

const editFavoritesHandlerMap = {
  [actionTypes.addReceipt]: (state: FavoritesStateData, action) => {
    return state.concat(action.resource);
  },
  [actionTypes.removeReceipt]: (state: FavoritesStateData, action) => {
    return state.filter(resource => resource.id !== action.resource.id && resource.source === action.resource.source);
  },
};

export default createSessionAsyncReducer(initialState, actionTypes, editFavoritesHandlerMap);
