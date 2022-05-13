/**
 * Zimbra Reducer
 */
import { ICountListState } from './state/count';
import { IFolderListState } from './state/folders';
import { IInitMailState } from './state/initMails';
import { IMailContentState } from './state/mailContent';
import { IMailListState } from './state/mailList';
import { IQuotaState } from './state/quota';
import { IRootFoldersListState } from './state/rootFolders';
import { ISignatureState } from './state/signature';

// State

export interface IZimbra_State {
  count: ICountListState;
  folders: IFolderListState;
  rootFolders: IRootFoldersListState;
  init: IInitMailState;
  mailContent: IMailContentState;
  mailList: IMailListState;
  quota: IQuotaState;
  signature: ISignatureState;
}
