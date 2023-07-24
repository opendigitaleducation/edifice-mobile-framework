import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ISession } from '~/framework/modules/auth/model';
import type { fetchZimbraMailAction, fetchZimbraSignatureAction } from '~/framework/modules/zimbra/actions';
import type { DraftType, IMail, ISignature } from '~/framework/modules/zimbra/model';
import type { ZimbraNavigationParams, zimbraRouteNames } from '~/framework/modules/zimbra/navigation';

export interface ZimbraComposerScreenProps {
  hasZimbraSendExternalRight: boolean;
  isFetching: boolean;
}

export interface ZimbraComposerScreenNavParams {
  type: DraftType;
  isTrashed?: boolean;
  mailId?: string;
  onNavigateBack?: () => void;
}

export interface ZimbraComposerScreenStoreProps {
  mail: IMail;
  signature: ISignature;
  session?: ISession;
}

export interface ZimbraComposerScreenDispatchProps {
  handlePickFileError: (notifierId: string) => void;
  tryFetchMail: (...args: Parameters<typeof fetchZimbraMailAction>) => Promise<IMail>;
  tryFetchSignature: (...args: Parameters<typeof fetchZimbraSignatureAction>) => Promise<ISignature>;
}

export type ZimbraComposerScreenPrivateProps = ZimbraComposerScreenProps &
  ZimbraComposerScreenStoreProps &
  ZimbraComposerScreenDispatchProps &
  NativeStackScreenProps<ZimbraNavigationParams, typeof zimbraRouteNames.composer>;
