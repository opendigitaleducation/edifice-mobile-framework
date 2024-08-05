import type { AuthActiveAccount } from '~/framework/modules/auth/model';
import { IAudioMedia, IVideoMedia } from '~/framework/util/media';

export interface MediaPlayerProps {
  connected: boolean;
  session?: AuthActiveAccount;
  media: IAudioMedia | IVideoMedia;
}
