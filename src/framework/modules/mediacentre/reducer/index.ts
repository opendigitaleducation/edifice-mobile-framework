/**
 * Mediacentre Reducer
 */
import { combineReducers } from 'redux';

import { Reducers } from '~/app/store';
import { MediacentreResources, Resource } from '~/framework/modules/mediacentre/model';
import moduleConfig from '~/framework/modules/mediacentre/module-config';
import { AsyncState, createAsyncActionTypes, createSessionAsyncReducer } from '~/framework/util/redux/async';

import favorites, { FavoritesStateData } from './favorites';
import selectedStructure, { SelectedStructureStateData } from './selectedStructure';

interface MediacentreReduxStateData {
  favorites: FavoritesStateData;
  resources: MediacentreResources;
  search: Resource[];
  selectedStructure: SelectedStructureStateData;
}

export interface MediacentreReduxState {
  favorites: AsyncState<FavoritesStateData>;
  resources: AsyncState<MediacentreResources>;
  search: AsyncState<Resource[]>;
  selectedStructure: AsyncState<SelectedStructureStateData>;
}

const initialState: MediacentreReduxStateData = {
  favorites: [],
  resources: {
    externals: [],
    pins: [],
    signets: [],
    textbooks: [],
  },
  search: [],
  selectedStructure: null,
};

export const actionTypes = {
  fetchResources: createAsyncActionTypes(moduleConfig.namespaceActionType('FETCH_RESOURCES')),
  search: createAsyncActionTypes(moduleConfig.namespaceActionType('SEARCH')),
};

const reducer = combineReducers({
  resources: createSessionAsyncReducer(initialState.resources, actionTypes.fetchResources),
  search: createSessionAsyncReducer(initialState.search, actionTypes.search),
  favorites,
  selectedStructure,
});
Reducers.register(moduleConfig.reducerName, reducer);
export default reducer;
