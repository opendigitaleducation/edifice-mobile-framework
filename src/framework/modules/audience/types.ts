import { AccountType } from '~/framework/modules/auth/model';

export interface AudienceUserReaction {
  userId: string;
  profile: AccountType;
  reactionType: string;
  displayName: string;
}

export interface AudienceReactions {
  reactionCounters: {
    allReactionsCounter: number;
    countByType: Record<string, number>;
  };
  userReactions: AudienceUserReaction[];
}

export interface AudienceSummaryReactions {
  reactionsByResource: Record<string, { reactionTypes: string[]; userReaction: string; totalReactionsCounter: number }>;
}

export interface AudienceValidReactionTypes {
  ['reaction-types']: string[];
}

export interface AudienceViewer {
  counter: number;
  profile: AccountType;
}

export interface AudienceViews {
  uniqueViewsCounter: number;
  uniqueViewsPerProfile: AudienceViewer[];
  viewsCounter: number;
}

export type AudienceSummaryViews = Record<string, number>;

export interface AudienceReferer {
  module: string;
  resourceType: string;
  resourceId: string;
}

export type AudienceParameter = AudienceReferer | string | undefined;
