import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Dispatch } from 'redux';

import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { HobbieItem } from '~/framework/modules/user/model';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { LocalFile, SyncedFile } from '~/framework/util/fileHandler';

export interface ProfilePageDataProps {
  session?: AuthLoggedAccount;
}

export interface ProfilePageEventProps {
  dispatch: Dispatch;
}

export type ProfilePageProps = ProfilePageDataProps &
  ProfilePageEventProps &
  NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.profile> & {
    onUploadAvatar: (avatar: LocalFile) => Promise<SyncedFile>;
    onUpdateAvatar: (uploadedAvatarUrl: string) => Promise<void>;
    onUploadAvatarError: () => void;
  };

export interface ProfileScreenNavigationParams {
  userId?: string;
  newHobbies?: HobbieItem[];
  newDescription?: string;
  newDescriptionVisibility?: boolean;
  newMood?: string;
  newMotto?: string;
}
