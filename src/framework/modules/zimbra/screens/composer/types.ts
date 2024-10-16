import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthLoggedAccount } from '~/framework/modules/auth/model';
import type { fetchZimbraMailAction, fetchZimbraSignatureAction } from '~/framework/modules/zimbra/actions';
import type { DraftType, IMail, ISignature } from '~/framework/modules/zimbra/model';
import type { ZimbraNavigationParams, zimbraRouteNames } from '~/framework/modules/zimbra/navigation';
import type { AsyncPagedLoadingState } from '~/framework/util/redux/asyncPaged';

export interface ZimbraComposerScreenProps {
  initialLoadingState: AsyncPagedLoadingState;
  hasZimbraSendExternalRight?: boolean;
}

export interface ZimbraComposerScreenNavParams {
  type: DraftType;
  isTrashed?: boolean;
  mailId?: string;
  onNavigateBack?: () => void;
}

export interface ZimbraComposerScreenStoreProps {
  signature: ISignature;
  mail?: IMail;
  session?: AuthLoggedAccount;
}

export interface ZimbraComposerScreenDispatchProps {
  tryFetchMail: (...args: Parameters<typeof fetchZimbraMailAction>) => Promise<IMail>;
  tryFetchSignature: (...args: Parameters<typeof fetchZimbraSignatureAction>) => Promise<ISignature>;
}

export type ZimbraComposerScreenPrivateProps = ZimbraComposerScreenProps &
  ZimbraComposerScreenStoreProps &
  ZimbraComposerScreenDispatchProps &
  NativeStackScreenProps<ZimbraNavigationParams, typeof zimbraRouteNames.composer>;
