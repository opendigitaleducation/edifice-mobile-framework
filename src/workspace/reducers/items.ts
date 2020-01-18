/**
 * Workspace state reducer
 * Holds a list of simple element in a simple Array
 */
import asyncReducer, { IAction } from "../../infra/redux/async";

import { actionTypesList } from "../actions/list";
import { actionTypesCreateFolder } from "../actions/create";
import { actionTypesRename } from "../actions/rename";
import { IItem, IState } from "../types";

const stateDefault: IState = {};

export default (state: IState = stateDefault, action: IAction<IItem>) => {
  switch (action.type) {
    case actionTypesCreateFolder.fetchError:
    case actionTypesCreateFolder.requested:
    case actionTypesCreateFolder.received:
      return pushData(state, action, actionTypesCreateFolder);
    case actionTypesList.fetchError:
    case actionTypesList.requested:
    case actionTypesList.received:
      return pushData(state, action, actionTypesList);
    case actionTypesRename.fetchError:
    case actionTypesRename.requested:
    case actionTypesRename.received:
      return pushData(state, action, actionTypesRename);
    default:
      return state;
  }
};

function pushData(state, action, actionTypes) {
  return {
    ...state,
    [action.payload.parentId]: asyncReducer<IState>(node, actionTypes)(state[action.payload.parentId] || {}, action),
  };
}

const node = (state: any, action: IAction<any>) => {
  switch (action.type) {
    case actionTypesCreateFolder.received:
      return {
        ...state,
        [action.data.id]: action.data,
      };
    case actionTypesList.received:
      return action.data;
    default:
      return state;
  }
};
