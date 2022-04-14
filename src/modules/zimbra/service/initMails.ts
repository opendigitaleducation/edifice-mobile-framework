import { fetchJSONWithCache } from '~/infra/fetchWithCache';
import { IInitMail } from '~/modules/zimbra/state/initMails';

// Data type of what is given by the backend.

export type IInitMailListBackend = {
  quota: {
    storage: number;
    quota: string;
  };
  signature: {
    prefered: boolean;
    id: string;
    content: string;
  };
  folders: [
    {
      id: string;
      folderName: string;
      path: string;
      unread: number;
      count: number;
      folders: [];
    },
  ];
};

const initMailListAdapter: (data: IInitMailListBackend) => IInitMail = data => {
  let result = {} as IInitMail;
  if (!data) return result;
  result = {
    quota: data.quota,
    signature: data.signature,
    folders: data.folders,
  };
  return result;
};

export const initMailService = {
  get: async () => {
    const data = await fetchJSONWithCache(`/zimbra/zimbra/json`);
    return initMailListAdapter(data);
  },
};
