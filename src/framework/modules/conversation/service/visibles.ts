import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { IVisibles } from '~/framework/modules/conversation/state/visibles';
import { signedFetchJson } from '~/infra/fetchWithCache';

export const visiblesService = {
  get: async (session: AuthLoggedAccount) => {
    const api = '/conversation/visible';
    return signedFetchJson(`${session?.platform!.url}${api}`) as Promise<IVisibles>;
  },
};
