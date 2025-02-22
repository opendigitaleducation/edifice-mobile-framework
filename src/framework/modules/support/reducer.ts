/**
 * Support Reducer
 */
import { combineReducers } from 'redux';

import moduleConfig from './module-config';

import { Reducers } from '~/app/store';
import moduleConfigWorkspace from '~/framework/modules/workspace/module-config';
import { createAsyncActionTypes, createSessionAsyncReducer } from '~/framework/util/redux/async';

// State
export interface ISupportState {}

// Reducer
export const actionTypes = {
  postTicket: createAsyncActionTypes(moduleConfigWorkspace.namespaceActionType('POST_TICKET')),
};

const reducer = combineReducers({
  ticket: createSessionAsyncReducer(undefined, actionTypes.postTicket),
});
Reducers.register(moduleConfig.reducerName, reducer);
export default reducer;
