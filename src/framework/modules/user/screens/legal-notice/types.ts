import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Dispatch } from 'redux';

import { LegalUrls } from '~/framework/modules/auth/model';
import type { UserNavigationParams } from '~/framework/modules/user/navigation';

export interface LegalItem {
  item: string;
  testID?: string;
}

export interface UserLegalNoticeScreenProps {}

export interface UserLegalNoticeScreenNavParams {}

export interface UserLegalNoticeScreenStoreProps {
  dispatch: Dispatch;
  legalUrls?: LegalUrls;
}

export interface UserLegalNoticeScreenDispatchProps {}

export interface UserLegalNoticeScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'legalNotice'>,
    UserLegalNoticeScreenProps,
    UserLegalNoticeScreenStoreProps,
    UserLegalNoticeScreenDispatchProps {}
