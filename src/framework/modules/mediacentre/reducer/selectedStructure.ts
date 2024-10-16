import moduleConfig from '~/framework/modules/mediacentre/module-config';
import {
  AsyncState,
  createAsyncActionCreators,
  createAsyncActionTypes,
  createSessionAsyncReducer,
} from '~/framework/util/redux/async';

export type SelectedStructureStateData = string | null;
export type SelectedStructureState = AsyncState<SelectedStructureStateData>;

const initialState: SelectedStructureStateData = null;

export const actionTypes = {
  ...createAsyncActionTypes(moduleConfig.namespaceActionType('SELECTED_STRUCTURE')),
  editRequest: moduleConfig.namespaceActionType('SELECTED_STRUCTURE_EDIT_REQUEST'),
  editReceipt: moduleConfig.namespaceActionType('SELECTED_STRUCTURE_EDIT_RECEIPT'),
  editError: moduleConfig.namespaceActionType('SELECTED_STRUCTURE_EDIT_ERROR'),
};
export const actions = {
  ...createAsyncActionCreators<SelectedStructureStateData>(actionTypes),
  editRequest: () => ({ type: actionTypes.editRequest }),
  editReceipt: (id: string) => ({ type: actionTypes.editReceipt, id }),
  editError: (error: Error) => ({ type: actionTypes.editError, error }),
};

const editSelectedStructureHandlerMap = {
  [actionTypes.editReceipt]: (state: SelectedStructureStateData, action) => {
    return action.id;
  },
};

export default createSessionAsyncReducer(initialState, actionTypes, editSelectedStructureHandlerMap);
