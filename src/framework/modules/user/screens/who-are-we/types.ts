import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { UserNavigationParams } from '~/framework/modules/user/navigation';

export interface UserWhoAreWeScreenProps {}

export interface UserWhoAreWeScreenNavParams {}

export interface UserWhoAreWeScreenStoreProps {}

export interface UserWhoAreWeScreenDispatchProps {}

export enum WhoAreWellustrationType {
  Animation = 'Animation',
  Image = 'Image',
}

export enum WhoAreWeQuoteType {
  HeadingXSText = 'HeadingXSText',
  BodyBoldText = 'BodyBoldText',
}

export interface UserWhoAreWeScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'whoAreWe'>,
    UserWhoAreWeScreenProps,
    UserWhoAreWeScreenStoreProps,
    UserWhoAreWeScreenDispatchProps {}
