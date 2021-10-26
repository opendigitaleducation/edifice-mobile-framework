import { Dispatch } from "redux";

import { createAsyncActionCreators } from "../../../../infra/redux/async2";
import { registerPreferencesService } from "../services/registerPreferences";
import { IRegisterPreferences, actionTypes } from "../state/registerPreferences";

// ACTION LIST ------------------------------------------------------------------------------------

export const dataActions = createAsyncActionCreators<IRegisterPreferences>(actionTypes);

// THUNKS -----------------------------------------------------------------------------------------

export function fetchRegiterPreferencesAction() {
  return async (dispatch: Dispatch) => {
    try {
      dispatch(dataActions.request());
      const data = await registerPreferencesService.get();
      dispatch(dataActions.receipt(data));
    } catch (errmsg) {
      dispatch(dataActions.error(errmsg));
    }
  };
}
