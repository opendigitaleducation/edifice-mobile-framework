import type { Temporal } from '@js-temporal/polyfill';

import type { API } from '~/framework/modules/explorer/service/types';

export interface ResourceHistory {
  updatedAt: Temporal.Instant; // timestamp
  updaterName: string;
  updaterId?: string; // Optional in case of updater is a deleted user.
  createdAt: Temporal.Instant; // timestamp
  creatorName: string;
  creatorId?: string; // Optional in case of updater is a deleted user.
}

export interface ExplorerNode extends ResourceHistory {
  id: string;
  assetId: string;
  name: string;
  application: string;
  sharedRights: API.Explorer.ResourceRights[];
  userRights: string[];
}

export const enum RootFolderId {
  ROOT = 'default',
  TRASH = 'bin',
}
export type UserFolderId = string;
export type FolderId = RootFolderId | UserFolderId;

export interface Folder extends ExplorerNode {
  resourceType: 'folder';
  location: FolderId[]; // breadcrumb of the folder. First node is the root.
}

export interface ExplorerPageData {
  pagination: {
    pageStart: number;
    pageSize: number;
    total: number;
  };
  folders: Folder[];
  resources: Resource[];
}

export interface Resource extends ExplorerNode {
  resourceType: string;
}

export interface ExplorerData {
  items: (Folder | Resource | null)[]; // null is used to fill array of loading resources from other pages
  nbResources: number;
  nbFolders: number;
}
