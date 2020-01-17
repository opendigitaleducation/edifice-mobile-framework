/**
 * Workspace state reducer
 * Holds a list of simple element in a simple Array
 */
import asyncReducer, { IAction } from "../../infra/redux/async";

import { actionTypesList } from "../actions/list";
import { FilterId, IItem, IState } from "../types";
import { actionTypesCreateFolder } from "../actions/create";

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
    default:
      return state;
  }
};

function pushData(state, action, actionTypes) {
  return {
    ...state,
    [action.id]: asyncReducer<IState>(node, actionTypes)(state[action.id] || {}, action),
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
