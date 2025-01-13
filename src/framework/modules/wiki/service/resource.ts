import {
  CreateParameters,
  CreateResult,
  IResource,
  ResourceService,
  UpdateParameters,
  UpdateResult,
} from '@edifice.io/client';

const APP = 'wiki';
const RESOURCE = 'wiki';

if (typeof window !== 'undefined' && !window.BroadcastChannel) {
  window.BroadcastChannel = class BroadcastChannel {
    constructor(channel) {
      this.channel = channel;
    }

    postMessage() { }

    addEventListener() { }

    removeEventListener() { }

    close() { }
  }
}

export class WikiResourceService extends ResourceService {
  /**
   *
   * @returns APP
   */
  getApplication(): string {
    return APP;
  }

  /**
   *
   * @param resourceId
   * @returns print url
   */
  getPrintUrl(resourceId: string): string {
    return `/wiki/print/id/${resourceId}`;
  }

  /**
   *
   * @param resourceId
   * @returns resource url
   */
  getViewUrl(resourceId: string): string {
    return `/wiki/id/${resourceId}`;
  }

  /**
   * (optional) Must be use to redirect to angularjs route to create a resource
   * @param folderId
   */
  getFormUrl(): string {
    // TODO ?
    throw new Error('Method not implemented.');
  }

  /**
   * (optional) Must be use to redirect to angularjs route to edit a resource
   * @param resourceId
   */
  getEditUrl(): string {
    // TODO ?
    throw new Error('Method not implemented.');
  }

  /**
   * Allow to create a new resource
   * @param parameters
   * @returns id and thumbnail
   */
  async create(parameters: CreateParameters): Promise<CreateResult> {
    const thumbnail = parameters.thumbnail
      ? await this.getThumbnailPath(parameters.thumbnail)
      : '';

    const res = await this.http.post<{ _id: string }>(`/wiki`, {
      title: parameters.name,
      description: parameters.description,
      thumbnail,
      folder: parameters.folder,
      trashed: false,
    });

    this.checkHttpResponse(res);

    return { entId: res._id, thumbnail };
  }

  /**
   * Allow to update a resource
   * @param parameters
   * @returns thumbnail and id
   */
  async update(parameters: UpdateParameters): Promise<UpdateResult> {
    const thumbnail = parameters.thumbnail
      ? await this.getThumbnailPath(parameters.thumbnail)
      : '';

    const res = await this.http.put<IResource>(`/wiki/${parameters.entId}`, {
      trashed: parameters.trashed,
      title: parameters.name,
      thumbnail,
      description: parameters.description,
    });
    this.checkHttpResponse(res);
    return { thumbnail: thumbnail, entId: parameters.entId } as UpdateResult;
  }

  /**
   *
   * @returns RESOURCE
   */
  getResourceType(): string {
    return RESOURCE;
  }
}

/**
 * Register the new service through Service Registry
 * It will look for an app, a resourceType
 * It gives access to the context (IOdeServices) to our new service
 */
ResourceService.register(
  { application: APP, resourceType: RESOURCE },
  (context) => new WikiResourceService(context),
);