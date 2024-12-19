import { ViewStyle } from 'react-native';

import { AudienceReferer } from '~/framework/modules/audience/types';
import { AuthActiveAccount } from '~/framework/modules/auth/model';

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

export interface UpdatedReactionsInfos {
  userReaction: string;
  totalReactionsCounter: number;
  reactionTypes: string[];
}

export interface AudienceAllProps extends AudienceProps, AudienceReduxProps {}
