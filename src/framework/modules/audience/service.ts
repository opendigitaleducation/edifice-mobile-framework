import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { fetchJSONWithCache, signedFetch, signedFetchRelative } from '~/infra/fetchWithCache';

import {
  AudienceReactions,
  AudienceReferer,
  AudienceSummaryReactions,
  AudienceSummaryViews,
  AudienceValidReactionTypes,
  AudienceViews,
} from './types';

export const audienceService = {
  reaction: {
    getValidReactionTypes: async () => {
      const api = `/audience/conf/public`;
      const validReactionTypes = await fetchJSONWithCache(api);
      return validReactionTypes as AudienceValidReactionTypes;
    },
    getDetails: async (referer: AudienceReferer, page: number, size: number) => {
      const api = `/audience/reactions/${referer.module}/${referer.resourceType}/${referer.resourceId}?page=${page}&size=${size}`;
      const entcoreAudienceReactions = await fetchJSONWithCache(api);
      return entcoreAudienceReactions as AudienceReactions;
    },
    getSummary: async (module: string, resourceType: string, resourceIds: string[]) => {
      const api = `/audience/reactions/${module}/${resourceType}?resourceIds=${resourceIds.join(',')}`;
      const audienceSummaryReactions = await fetchJSONWithCache(api);
      return audienceSummaryReactions as AudienceSummaryReactions;
    },
    post: async (session: AuthActiveAccount, referer: AudienceReferer, reaction: string) => {
      const api = `/audience/reactions/${referer.module}/${referer.resourceType}`;
      const body = JSON.stringify({
        resourceId: referer.resourceId,
        reactionType: reaction,
      });
      return signedFetch(`${session.platform.url}${api}`, {
        method: 'POST',
        body,
      }) as Promise<any>;
    },
    update: async (session: AuthActiveAccount, referer: AudienceReferer, reaction: string) => {
      const api = `/audience/reactions/${referer.module}/${referer.resourceType}`;
      const body = JSON.stringify({
        resourceId: referer.resourceId,
        reactionType: reaction,
      });
      return signedFetch(`${session.platform.url}${api}`, {
        method: 'PUT',
        body,
      }) as Promise<any>;
    },
    delete: async (session: AuthActiveAccount, referer: AudienceReferer) => {
      const api = `/audience/reactions/${referer.module}/${referer.resourceType}/${referer.resourceId}`;
      return signedFetch(`${session.platform.url}${api}`, {
        method: 'DELETE',
      }) as Promise<Response>;
    },
  },
  view: {
    getDetails: async (referer: AudienceReferer) => {
      const api = `/audience/views/details/${referer.module}/${referer.resourceType}/${referer.resourceId}`;
      const audienceViews = await fetchJSONWithCache(api);
      return audienceViews as AudienceViews;
    },
    getSummary: async (module: string, resourceType: string, resourceIds: string[]) => {
      const api = `/audience/views/count/${module}/${resourceType}?resourceIds=${resourceIds.join(',')}`;
      const audienceSummaryViews = await fetchJSONWithCache(api);
      return audienceSummaryViews as AudienceSummaryViews;
    },
    post: async (module: string, resourceType: string, resourceId: string) => {
      try {
        return await signedFetchRelative(`/audience/views/${module}/${resourceType}/${resourceId}`, {
          method: 'POST',
        });
      } catch (e) {
        console.error('[Audience] failed to request', e);
      }
    },
  },
};
