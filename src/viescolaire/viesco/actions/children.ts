import { Dispatch } from "redux";

import { dataActions as homeworkActions } from "../../cdt/actions/homeworks";
import { dataActions as sessionActions } from "../../cdt/actions/sessions";
import { dataActions as teacherActions } from "../../viesco/actions/personnel";
import { dataActions as subjectActions } from "../../viesco/actions/subjects";
import { selectChildActionType } from "../state/children";

// ACTION LIST ------------------------------------------------------------------------------------

export const selectChild = (child: string) => ({ type: selectChildActionType, selectedChild: child });

// THUNKS -----------------------------------------------------------------------------------------

export function selectChildAction(child: string) {
  return async (dispatch: Dispatch) => {
    dispatch(homeworkActions.clear());
    dispatch(sessionActions.clear());
    dispatch(teacherActions.clear());
    dispatch(subjectActions.clear());
    dispatch(selectChild(child));
  };
}
