import { Dispatch } from "redux";

import { createAsyncActionCreators } from "../../../../infra/redux/async2";
import { childrenGroupsService } from "../services/childrenGroups";
import { actionTypes, IChildrenGroups } from "../state/childrenGroups";

// ACTION LIST ------------------------------------------------------------------------------------

export const dataActions = createAsyncActionCreators<IChildrenGroups>(actionTypes);

// THUNKS -----------------------------------------------------------------------------------------

export function fetchChildrenGroupsAction(idStructure: string) {
  return async (dispatch: Dispatch) => {
    try {
      dispatch(dataActions.request());
      const data = await childrenGroupsService.get(idStructure);
      dispatch(dataActions.receipt(data));
    } catch (errmsg) {
      dispatch(dataActions.error(errmsg));
    }
  };
}
