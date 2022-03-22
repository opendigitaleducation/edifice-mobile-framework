import { LocalFile } from '~/framework/util/fileHandler';
import fileHandlerService from '~/framework/util/fileHandler/service';
import { IUserSession } from '~/framework/util/session';
import { fetchJSONWithCache } from '~/infra/fetchWithCache';


export type IUser = {
  id: string;
  displayName: string;
  groupDisplayName: string;
  profile: string;
  structureName: string;
};

export type ISearchUsers = IUser[];

export type ISearchUsersGroups = {
  groups: {
    id: string;
    name: string;
    displayName: string;
    profile: string;
    structureName: string;
  }[];
  users: ISearchUsers;
};

const formatMailDatas = mailDatas => ({
  ...mailDatas,
  attachments: mailDatas.attachments.map(att => ({
    contentType: att.filetype,
    filename: att.filename,
    size: att.filesize,
    id: att.id,
  })),
});

export const newMailService = {
  searchUsers: async search => {
    return await fetchJSONWithCache(`/zimbra/visible?search=${search}`);
  },
  sendMail: async (mailDatas, draftId, inReplyTo) => {
    const params = {
      id: draftId,
      'In-Reply-To': inReplyTo,
    };

    const paramsUrlArray = [] as string[];
    for (const key in params) {
      const value = params[key];
      if (!!value) { paramsUrlArray.push(`${key}=${value}`); }
    }
    const paramsUrl = paramsUrlArray.join('&');

    await fetchJSONWithCache(`/zimbra/send${paramsUrl?.length > 0 ? '?' + paramsUrl : ''}`, {
      method: 'POST',
      body: JSON.stringify(formatMailDatas(mailDatas)),
    });
  },
  forwardMail: async (draftId, forwardFrom) => {
    await fetchJSONWithCache(`/zimbra/message/${draftId}/forward/${forwardFrom}`, {
      method: 'PUT',
    });
  },
  makeDraftMail: async (mailDatas, inReplyTo, isForward) => {
    const params = {
      'In-Reply-To': inReplyTo,
      reply: isForward ? 'F' : null,
    };

    const paramsUrlArray = [] as string[];
    for (const key in params) {
      const value = params[key];
      if (!!value) {
        paramsUrlArray.push(`${key}=${value}`);
      }
    }
    const paramsUrl = paramsUrlArray.join('&');

    const response = await fetchJSONWithCache(`/zimbra/draft${paramsUrl?.length > 0 ? '?' + paramsUrl : ''}`, {
      method: 'POST',
      body: JSON.stringify(formatMailDatas(mailDatas)),
    });
    return response.id;
  },
  updateDraftMail: async (mailId, mailDatas) => {
    await fetchJSONWithCache(`/zimbra/draft/${mailId}`, { method: 'PUT', body: JSON.stringify(formatMailDatas(mailDatas)) });
  },
  addAttachment: async (session: IUserSession, draftId: string, file: LocalFile, handleProgession) => {
    const url = `/zimbra/message/${draftId}/attachment`;
    let dataJson;
    // console.log("DATA TO BE UPLOADED", file);
    const ret = await fileHandlerService.uploadFile(
      session,
      file,
      {
        url,
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        binaryStreamOnly: true,
      },
      data => {
        dataJson = JSON.parse(data).attachments as {
          contentType: string;
          filename: string;
          id: string;
          size: number;
        }[];
        // console.log("upload returned", dataJson)
        return dataJson as any; // YES IT IZ A BAD PRAKTICE.
        // This API is fucked up : every attachment id changes when a new attachement is uplaoded.
        // We'll need to manuelly restore attachments data outside this function
      },
      {
        onProgress: res => handleProgession((res.totalBytesSent / res.totalBytesExpectedToSend) * 100),
      },
    );
    // console.log("service is to be returning", dataJson);
    return dataJson;
  },
  deleteAttachment: async (draftId: string, attachmentId: string) => {
    return await fetchJSONWithCache(`/zimbra/message/${draftId}/attachment/${attachmentId}`, { method: 'DELETE' });
  },
};