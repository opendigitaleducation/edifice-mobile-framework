/**
 * workspace list actions
 * Build actions to be dispatched to the hworkspace list reducer.
 */

import RNFB from 'rn-fetch-blob';
import moment from "moment";
import Mime from "mime";
import {asyncGetJson} from "../../../infra/redux/async";
import {IItems, IFiltersParameters, IFile, FilterId, IItem, ContentUri} from "../../types";
import {filters} from "../../types/filters/helpers/filters";
import Conf from "../../../../ode-framework-conf";
import {OAuth2RessourceOwnerPasswordClient} from "../../../infra/oauth";
import {Platform} from "react-native";


// TYPE -------------------------------------------------------------------------------------------

export type IBackendDocument = {
  _id: string;
  name: string;
  metadata: {
    name: "file";
    filename: string;
    "content-type": string;
    "content-transfer-encoding": string;
    charset: "UTF-8";
    size: number;
  };
  deleted: boolean;
  eParent: string | null;
  eType: "file";
  file: string;
  shared: [];
  inheritedShares: [];
  created: string;
  modified: string;
  owner: string;
  ownerName: string;
  thumbnails: { [id: string]: string };
};

export type IBackendDocumentArray = Array<IBackendDocument>;

// ADAPTER ----------------------------------------------------------------------------------------

export const backendDocumentsAdapter: (data: IBackendDocumentArray) => IItems<IFile> = data => {
  const result = {} as IItems<IFile>;
  if (!data) return result;
  for (const item of data) {
    if (item.deleted) continue;
    result[item._id] = {
      contentType: item.metadata["content-type"],
      date: moment(item.modified, "YYYY-MM-DD HH:mm.ss.SSS").toDate().getTime(),
      filename: item.metadata.filename,
      id: item._id,
      isFolder: false,
      name: item.name,
      owner: filters(item.owner),
      ownerName: item.ownerName,
      size: item.metadata.size,
      url: `/workspace/document/${item._id}`
    };
  }
  return result;
};

// GET -----------------------------------------------------------------------------------------

export function getDocuments(parameters: IFiltersParameters): Promise<IItems<IItem>> {
  const {parentId} = parameters;

  if (parentId === FilterId.root) return Promise.resolve({});

  const formatParameters = (parameters = {}) => {
    let result = "?";

    for (let key in parameters) {
      if (!(parameters as any)[key]) continue;
      if (key === "parentId" && (parameters as any)[key] in FilterId)    // its a root folder, no pass parentId
        continue;
      result = result.concat(`${key}=${(parameters as any)[key]}&`);
    }
    return result.slice(0, -1);
  };

  return asyncGetJson(`/workspace/documents${formatParameters(parameters)}`, backendDocumentsAdapter);
}

// UPLOAD --------------------------------------------------------------------------------------

export const uploadDocument = (uri: any, onEnd: any) => {
  const signedHeaders = OAuth2RessourceOwnerPasswordClient.connection.sign({}).headers;
  const headers = {...signedHeaders, "content-Type": "multipart/form-data"};
  const body = buildBody(uri);

  RNFB.fetch(
    "POST",
    `${Conf.currentPlatform.url}/workspace/document?quality=1&thumbnail=120x120&thumbnail=100x100&thumbnail=290x290&thumbnail=381x381&thumbnail=1600x0`,
    headers,
    body,
  )
    .then((response) => {
      onEnd(response)
    })
    .catch((err) => {
        console.log(err)
      }
    )
};

export const buildBody = ( contentUri: any):any => {
  if (Platform.OS === "android")
    return (contentUri as any[]).reduce( (acc, item, index) =>
      [...acc, { name: `document${index}`, type: item.mime, filename: item.name, data: RNFB.wrap(item.uri)}], [])
   else {
     const fullPath:string = contentUri
     const start = fullPath.indexOf( "file:///")
       ? 8
       : fullPath.indexOf( "file://")
          ? 7
          : 0;
     const path = fullPath.substring( start);
     const type = Mime.getType(path);
     const filename = fullPath.substring(fullPath.lastIndexOf('/') + 1 );

     return { name: `document${0}`, type, filename, data: RNFB.wrap(path)}
  }
}
