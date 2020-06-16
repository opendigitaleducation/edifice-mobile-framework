import moment from "moment";

import { createAsyncActionTypes, AsyncState, AsyncActionTypes } from "../../../infra/redux/async2";
import viescoConfig from "../../config";

// THE MODEL --------------------------------------------------------------------------------------

export interface IHomework {
  due_date: moment.Moment;
  id: string;
  progress?: {
    created: string;
    homework_id: number;
    modified: string;
    state_id: number;
    state_label: string;
    user_id: string;
  };
  subject_id: string;
  type: string;
}

export type IHomeworkList = IHomework[];

// THE STATE --------------------------------------------------------------------------------------

export type IHomeworkListState = AsyncState<IHomeworkList>;

export const initialState: IHomeworkListState = { data: [], isPristine: true, isFetching: false };

export const getHomeworksListState = (globalState: any) =>
  viescoConfig.getLocalState(globalState).cdt.homeworksList as IHomeworkListState;

// THE ACTION TYPES -------------------------------------------------------------------------------

export const listActionTypes : AsyncActionTypes = createAsyncActionTypes(viescoConfig.createActionType("CDT_HOMEWORK_LIST"));
export const updateActionTypes : AsyncActionTypes = createAsyncActionTypes(viescoConfig.createActionType("CDT_HOMEWORK_UPDATE"));
