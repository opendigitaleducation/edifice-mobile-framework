import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { UserNavigationParams } from '~/framework/modules/user/navigation';

export interface UserNotifPrefsScreenProps {
  // @scaffolder add props here
}

export interface UserNotifPrefsScreenNavParams {
  // requiredFoo: string; // @scaffolder remove example
  // optionalBar?: number; // @scaffolder remove example
  // @scaffolder add nav params here. Use type `undefined` if no navParams at all.
}

export interface UserNotifPrefsScreenStoreProps {
  // @scaffolder add store props here
}

export interface UserNotifPrefsScreenDispatchProps {
  // @scaffolder add dispatch props here
}

export interface UserNotifPrefsScreenPrivateProps
  extends NativeStackScreenProps<UserNavigationParams, 'notifPrefs'>,
    UserNotifPrefsScreenProps,
    UserNotifPrefsScreenStoreProps,
    UserNotifPrefsScreenDispatchProps {
  // @scaffolder add HOC props here
}
