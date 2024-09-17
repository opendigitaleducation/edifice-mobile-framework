export interface AudienceReactButtonReduxProps {
  validReactionTypes: string[];
}

export interface AudienceReactButtonProps {
  userReaction: string | null;
  deleteReaction: () => void;
  postReaction: (reaction: string) => void;
  updateReaction: (reaction: string) => void;
}

export interface AudienceReactButtonAllProps extends AudienceReactButtonProps, AudienceReactButtonReduxProps {}
