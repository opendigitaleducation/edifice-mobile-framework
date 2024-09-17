import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AudienceParameter } from '~/framework/modules/audience/types';
import type { AuthActiveAccount } from '~/framework/modules/auth/model';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';

export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video',
  WEB = 'web',
}

export interface MediaPlayerParams {
  type: MediaType;
  source: any;
  filetype?: string;
  referer: AudienceParameter;
}

export interface MediaPlayerProps extends NativeStackScreenProps<IModalsNavigationParams, ModalsRouteNames.MediaPlayer> {
  connected: boolean;
  session?: AuthActiveAccount;
}
