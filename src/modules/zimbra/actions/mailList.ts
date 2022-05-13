import { Dispatch } from 'redux';

import { createAsyncActionCreators } from '~/infra/redux/async2';
import { mailListService } from '~/modules/zimbra/service/mailList';
import { IMailList, actionTypes } from '~/modules/zimbra/state/mailList';

// ACTION LIST ------------------------------------------------------------------------------------

export const dataActions = createAsyncActionCreators<IMailList>(actionTypes);

// THUNKS -----------------------------------------------------------------------------------------

export function fetchMailListAction(page: number, folderName: string, searchText: string = '') {
  return async (dispatch: Dispatch) => {
    try {
      dispatch(dataActions.request());
      const data = await mailListService.get(page, searchText, folderName);
      dispatch(dataActions.receipt(data));
    } catch (errmsg) {
      dispatch(dataActions.error(errmsg));
    }
  };
}

export function fetchMailListFromFolderAction(folderLocation: string, page: number, searchText: string = '') {
  return async (dispatch: Dispatch) => {
    try {
      dispatch(dataActions.request());
      const data = await mailListService.getFromFolder(folderLocation, page, searchText);
      dispatch(dataActions.receipt(data));
    } catch (errmsg) {
      dispatch(dataActions.error(errmsg));
    }
  };
}
