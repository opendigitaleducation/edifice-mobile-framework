import { Dispatch } from "redux";

import { Trackers } from "../../../infra/tracker";
import { newMailService } from "../service/newMail";

export function sendMailAction(mailDatas, draftId: string | undefined, InReplyTo: string) {
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
    return await newMailService.makeDraftMail(mailDatas, inReplyTo);
  };
}

export function updateDraftMailAction(mailId: string, mailDatas) {
  return async () => {
    return await newMailService.updateDraftMail(mailId, mailDatas);
  };
}

export function addAttachmentAction(mailId: string, attachment: any) {
  return async (dispatch: Dispatch) => {
    try {
      const newAttachment = await newMailService.addAttachment(mailId, attachment);
      return newAttachment;
    } catch (errmsg) {
      console.log("ERROR uploading attachment", errmsg);
      throw errmsg;
    }
  };
}

export function deleteAttachmentAction(mailId: string, attachmentId: string) {
  return async (dispatch: Dispatch) => await newMailService.deleteAttachment(mailId, attachmentId);
}
