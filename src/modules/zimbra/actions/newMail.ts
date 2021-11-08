import { Dispatch } from "redux";

import { Trackers } from "../../../framework/util/tracker";
import { progressAction, progressEndAction, progressInitAction } from "../../../infra/actions/progress";
import { newMailService } from "../service/newMail";
import { getUserSession } from "../../../framework/util/session";
import { IGlobalState } from "../../../AppStore";

export function sendMailAction(mailDatas, draftId: string, InReplyTo: string) {
  return async () => {
    Trackers.trackEvent("Zimbra", "SEND");
    try {
      await newMailService.sendMail(mailDatas, draftId, InReplyTo);
    } catch (errmsg) {
      console.error("ERROR new mail: ", errmsg);
    }
  };
}

export function forwardMailAction(draftId: string, forwardFrom: string) {
  return async () => {
    try {
      await newMailService.forwardMail(draftId, forwardFrom);
    } catch (errmsg) {
      console.error("ERROR forward mail: ", errmsg);
    }
  };
}

export function makeDraftMailAction(mailDatas, inReplyTo: string, isForward: boolean) {
  return async (dispatch: Dispatch) => {
    Trackers.trackEvent("Zimbra", "CREATED");
    if (inReplyTo) Trackers.trackEvent("Zimbra", "REPLY TO MESSAGE");
    if (isForward) Trackers.trackEvent("Zimbra", "TRANSFER MESSAGE");
    return await newMailService.makeDraftMail(mailDatas, inReplyTo, isForward);
  };
}

export function updateDraftMailAction(mailId: string, mailDatas) {
  return async () => {
    return await newMailService.updateDraftMail(mailId, mailDatas);
  };
}

export function addAttachmentAction(mailId: string, attachment: any) {
  return async (dispatch: Dispatch, getState: () => IGlobalState) => {
    try {
      dispatch(progressInitAction());
      const handleProgress = progress => dispatch(progressAction(progress));
      const session = getUserSession(getState());
      // console.log("will upload attachment with service", attachment);
      const newAttachments = await newMailService.addAttachment(session, mailId, attachment, handleProgress);
      // console.log("addAttachmentAction services returned", newAttachments);
      dispatch(progressEndAction());
      return newAttachments;
    } catch (errmsg) {
      // console.log("ERROR uploading attachment", errmsg);
      dispatch(progressEndAction());
      throw errmsg;
    }
  };
}

export function deleteAttachmentAction(mailId: string, attachmentId: string) {
  return async (dispatch: Dispatch) => await newMailService.deleteAttachment(mailId, attachmentId);
}
