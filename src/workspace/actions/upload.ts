// require the module
import { Platform } from "react-native";
import getPath from "@flyerhq/react-native-android-uri-path";
import { asyncActionTypes } from "../../infra/redux/async";
import config from "../config";
import { formatResults, uploadDocumentAction } from "./helpers/documents";
import { ContentUri } from "../types";
import { Trackers } from "../../infra/tracker";

// ACTION UPLOAD ------------------------------------------------------------------------------------

export const actionTypesUpload = asyncActionTypes(config.createActionType("WORKSPACE_UPLOAD"));

export function uploadRequested(parentId) {
  return {
    type: actionTypesUpload.requested,
    payload: {
      parentId,
    },
  };
}

export function uploadReceived(parentId, data: any) {
  return {
    type: actionTypesUpload.received,
    data,
    receivedAt: Date.now(),
    payload: {
      parentId,
    },
  };
}

export function uploadError(parentId, errmsg: string) {
  return {
    type: actionTypesUpload.fetchError,
    error: true,
    errmsg,
    payload: {
      parentId,
    },
  };
}

/**
 * Take a file from the mobile and post it to the backend.
 * Dispatches WORKSPACE_UPLOAD_REQUESTED, WORKSPACE_UPLOAD_RECEIVED, and WORKSPACE_UPLOAD_FETCH_ERROR if an error occurs.
 */
export function uploadAction(parentId: string, uriContent: ContentUri[] | ContentUri, doTrack: boolean = true) {
  return async (dispatch: any) => {
    try {
      const content = Array.isArray(uriContent) ? uriContent : [uriContent];
      for (uriContent of content) {
        uriContent.uri = Platform.select({
          android: getPath(uriContent.uri),
          default: decodeURI(
            uriContent.uri.indexOf("file://") > -1 ? uriContent.uri.split("file://")[1] : uriContent.uri
          ),
        });
      }
      dispatch(uploadRequested(parentId));
      const response = await dispatch(uploadDocumentAction(content, parentId));
      const data = response.map(item => JSON.parse(item));
      dispatch(uploadReceived(parentId, formatResults(data)));
      doTrack && Trackers.trackEvent("Workspace", "UPLOAD");
    } catch (ex) {
      console.log(ex);
      dispatch(uploadError(parentId, ex));
    }
  };
}
