import { ViewStyle } from 'react-native';

import { AuthActiveAccount } from '~/framework/modules/auth/model';
import { AudienceReferer } from '~/framework/modules/core/audience/types';

export interface AudienceReduxProps {
  validReactionTypes: string[];
}
export interface AudienceProps {
  referer: AudienceReferer;
  session: AuthActiveAccount;
  nbComments?: number;
  nbViews?: number;
  infosReactions?: {
    total: number;
    types: string[];
    userReaction?: string;
  };
  containerStyle?: ViewStyle;
  preview?: boolean;
  isManager?: boolean;
}

export interface AudienceAllProps extends AudienceProps, AudienceReduxProps {}
