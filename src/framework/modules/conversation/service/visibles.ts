import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { IVisibles } from '~/framework/modules/conversation/state/visibles';
import { signedFetchJson } from '~/infra/fetchWithCache';

export const visiblesService = {
  get: async (session: AuthActiveAccount) => {
    const api = '/communication/visible/search';
    return signedFetchJson(`${session?.platform!.url}${api}`) as Promise<IVisibles>;
  },
};
