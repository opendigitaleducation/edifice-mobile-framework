import { fetchJSONWithCache } from '~/infra/fetchWithCache';
import { resourcesAdapter } from '~/modules/mediacentre/services/textbooks';

export const signetsService = {
  get: async (userId: string) => {
    const signetsResponse = await fetchJSONWithCache(`/mediacentre/signets`, {
      method: 'get',
    });
    const mysignetsResponse = await fetchJSONWithCache(`/mediacentre/mysignets`, {
      method: 'get',
    });
    return resourcesAdapter(signetsResponse.data.signets.resources)
      .filter(resource => resource.types.includes('Signet'))
      .concat(resourcesAdapter(mysignetsResponse).filter(resource => resource.owner_id !== userId));
  },
  getOrientation: async () => {
    const resources = await fetchJSONWithCache(`/mediacentre/signets`, {
      method: 'get',
    });
    return resourcesAdapter(resources.data.signets.resources).filter(resource => resource.types.includes('Orientation'));
  },
};
