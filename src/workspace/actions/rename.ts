// ACTION LIST ------------------------------------------------------------------------------------

import { asyncActionTypes } from "../../infra/redux/async";
import config from "../config";
import { asyncActionFactory } from "../../infra/actions/asyncActionFactory";
import {formatResult, formatResults} from "./helpers/documents";

const WORKSPACE_RENAME = "/workspace/rename";
const WORKSPACE_FOLDER_RENAME = "/workspace/folder/rename";

export const actionTypesRename = asyncActionTypes(config.createActionType(`${WORKSPACE_RENAME}`));

/**
 * Rename document.
 * Dispatches WORKSPACE_RENAME_REQUESTED, WORKSPACE_RENAME_RECEIVED, and WORKSPACE_RENAME_FETCH_ERROR if an error occurs.
 */
export function renameAction(name, item, parentId) {
  const url = item.isFolder ? `${WORKSPACE_FOLDER_RENAME}/${item.id}` : `${WORKSPACE_RENAME}/${item.id}`;

  return asyncActionFactory(url, { name, parentId }, actionTypesRename, formatResults, { method: "put" });
}
