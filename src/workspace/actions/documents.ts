/**
 * workspace list actions
 * Build actions to be dispatched to the hworkspace list reducer.
 */

import { asyncActionTypes, asyncGetJson } from "../../infra/redux/async";
import workspaceConfig from "../config";
import { IWorkspaceBackendDocumentArray, IWorkspaceDocumentArray } from "../types";

// ADAPTER ----------------------------------------------------------------------------------------

const backendDocumentsAdapter: (data: IWorkspaceBackendDocumentArray) => IWorkspaceDocumentArray = data => {
  const result = {} as any;
  if (!data) return result;
  for (const item of data) {
    result[item._id] = {
      id: item._id,
      name: item.name,
      owner: item.owner,
      ownerName: item.ownerName,
    };
  }
  return result;
};

// ACTION LIST ------------------------------------------------------------------------------------

export const actionTypes = asyncActionTypes(workspaceConfig.createActionType("DOCUMENTS"));

export function documentsListInvalidated() {
  return { type: actionTypes.invalidated };
}

export function documentsListRequested() {
  return { type: actionTypes.requested };
}

export function documentsListReceived(data: IWorkspaceDocumentArray) {
  return { type: actionTypes.received, data, receivedAt: Date.now() };
}

export function documentsListFetchError(errmsg: string) {
  return { type: actionTypes.fetchError, error: true, errmsg };
}

// THUNKS -----------------------------------------------------------------------------------------

export function getFolderDocuments(parentId: string) {
  return getDocuments({ parentId });
}

function getDocuments(parameters: Partial<IDocumentsParameters>) {
  const formatParameters = (parameters = {}) => {
    let result = "?";
    for (let key in parameters) {
      if (parameters[key]) {
        result = result.concat(`${key}=${parameters[key]}&`);
      }
    }
    return result.slice(0, -1);
  };

  return async (dispatch, getState) => {
    dispatch(documentsListRequested());
    try {
      const data = await asyncGetJson(`/workspace/documents${formatParameters(parameters)}`, backendDocumentsAdapter);
      dispatch(documentsListReceived(data));
    } catch (errmsg) {
      dispatch(documentsListFetchError(errmsg));
    }
  };
}
