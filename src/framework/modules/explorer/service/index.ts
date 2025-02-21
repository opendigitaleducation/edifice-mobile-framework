import { Temporal } from '@js-temporal/polyfill';

import type { API } from './types';

import type { ExplorerNode, ExplorerPageData, ResourceHistory } from '~/framework/modules/explorer/model/types';
import http from '~/framework/util/http';

const hydrateResourceHistory = (
  data: API.Explorer.ResourcesPageOK['folders'][0] | API.Explorer.ResourcesPageOK['resources'][0],
): ResourceHistory => ({
  createdAt: Temporal.Instant.fromEpochMilliseconds(data.createdAt),
  creatorId: data.creatorId,
  creatorName: data.creatorName,
  updatedAt: Temporal.Instant.fromEpochMilliseconds(data.updatedAt),
  updaterId: data.updaterId,
  updaterName: data.updaterName,
});

const hydrateExplorerNode = (
  data: API.Explorer.ResourcesPageOK['folders'][0] | API.Explorer.ResourcesPageOK['resources'][0],
): ExplorerNode => ({
  application: data.application,
  assetId: data.assetId,
  id: data.id,
  name: data.name,
  sharedRights: data.rights,
  userRights: [], // ToDo,
  ...hydrateResourceHistory(data),
});

const hydrateFolder = (data: API.Explorer.ResourcesPageOK['folders'][0]): ExplorerPageData['folders'][0] => ({
  location: data.ancestors,
  resourceType: 'folder',
  ...hydrateExplorerNode(data),
});

const hydrateResource = (data: API.Explorer.ResourcesPageOK['resources'][0]): ExplorerPageData['resources'][0] => ({
  resourceType: data.resourceType,
  thumbnail: data.thumbnail,
  ...hydrateExplorerNode(data),
});

const hydrateResources = (data: API.Explorer.ResourcesPageOK): ExplorerPageData => ({
  folders: data.folders.map(hydrateFolder),
  pagination: {
    pageSize: data.pagination.pageSize,
    pageStart: data.pagination.startIdx,
    total: data.pagination.maxIdx,
  },
  resources: data.resources.map(hydrateResource),
});

export default {
  resources: {
    get: async (opts: API.Explorer.ResourcesPageQuery) => {
      try {
        const rawData: API.Explorer.ResourcesPageOK = await http.fetchJsonForSession(
          `/explorer/resources?${new URLSearchParams(Object.entries(opts))}`,
        );
        return hydrateResources(rawData);
      } catch (e) {
        throw e;
      }
    },
  },
};
