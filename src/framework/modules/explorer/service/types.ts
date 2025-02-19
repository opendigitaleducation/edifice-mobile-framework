export namespace API {
  export namespace Explorer {
    export const BOOLEAN_FILTER = {
      FAVORITE: 'favorite',
      OWNER: 'owner',
      PUBLIC: 'public',
      SHARED: 'shared',
      TRASHED: 'trashed',
    } as const;
    export type BooleanFilterQuery = Partial<{ [key in (typeof BOOLEAN_FILTER)[keyof typeof BOOLEAN_FILTER]]: boolean }>;

    export type ROOT_FOLDER =
      | 'bin' // trash folder
      | 'default '; // root folder;

    export type FolderId = ROOT_FOLDER | string;

    export interface PaginationQuery {
      start_idx: number;
      page_size: number;
    }

    export interface ContextQuery {
      application: string;
      resource_type: string;
    }

    export interface ContextResponse {
      application: string;
      resourceType: string;
    }

    export type OrderByFields = 'name' | 'updatedAt' | 'createdAt' | 'application' | 'resourceType';
    export type OrderByDirection = 'asc' | 'desc';

    export interface ResourcesPageQuery extends BooleanFilterQuery, PaginationQuery, ContextQuery {
      order_by: `${OrderByFields}:${OrderByDirection}`;
      folder: FolderId;
      search?: string;
    }

    export interface PaginationResponse {
      startIdx: number;
      pageSize: number;
      maxIdx: number; // Wrong name ! This is the total number of resources (folders excluded).
    }

    export interface ResourceHistory {
      updatedAt: number; // timestamp
      updaterName: string;
      updaterId?: string; // Optional in case of updater is a deleted user.
      createdAt: number; // timestamp
      creatorName: string;
      creatorId?: string; // Optional in case of updater is a deleted user.
      version: number; // timestamp
    }

    export type ResourceRights = string;

    export interface ExplorerNodeResponse extends ContextResponse, ResourceHistory {
      id: string;
      assetId: string;
      name: string;
      trashed: boolean;
      public: boolean;
    }

    export interface FolderResponse extends ExplorerNodeResponse {
      parentId: FolderId;
      childNumber: number;
      subresources: unknown[];
      rights: ResourceRights[];
      folderIds: unknown[];
      usersForFolderIds: unknown[];
      childrenIds: FolderId[];
      ancestors: FolderId[]; // breadcrumb
      entityType: 'folder';
    }

    export interface ResourceResponse extends ExplorerNodeResponse {
      thumbnail: string;
      usersForFolderIds: unknown[];
      entityType: string;
      rights: ResourceRights[];
    }

    export interface ResourcesPageOK {
      pagination: PaginationResponse;
      searchConfig: object;
      folders: FolderResponse[];
      resources: ResourceResponse[];
    }
    export interface ResourcesPageError {
      // ToDo
    }
  }
}
