import type React from 'react';
import type { ContentItemBodyImperative, ContentReplacedSubstringComponentInfo } from '@/components/contents/contentBodyUtil';
import type { VotingProps } from '@/components/votes/votingProps';
import type { TagLens } from '../arbital/useTagLenses';
import type { VotingSystemName } from './votingSystemNames';

export type VotingPropsDocument = CommentsList | PostsWithVotes | RevisionMetadataWithChangeMetrics | MultiDocumentMinimumInfo;export type CommentVotingComponentProps<T extends VotingPropsDocument = VotingPropsDocument> = {
  document: T;
  hideKarma?: boolean;
  collectionName: VoteableCollectionName;
  votingSystem: VotingSystem;
  commentBodyRef?: React.RefObject<ContentItemBodyImperative | null> | null;
  voteProps?: VotingProps<VoteableTypeClient>;
  post?: PostsWithNavigation | PostsWithNavigationAndRevision;
};

export interface NamesAttachedReactionsCommentBottomProps extends CommentVotingComponentProps<CommentsList> {
  voteProps: VotingProps<VoteableTypeClient>;
}

export type PostVotingComponentProps = {
  document: PostsWithVotes;
  votingSystem: VotingSystem;
  isFooter?: boolean;
};

export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;
export type CommentVotingBottomComponent = React.ComponentType<NamesAttachedReactionsCommentBottomProps>;
export type PostVotingComponent = React.ComponentType<PostVotingComponentProps>;

export interface VotingSystem<ExtendedVoteType = any, ExtendedScoreType = any> {
  name: VotingSystemName;
  description: string;
  hasInlineReacts?: boolean;
  userCanActivate?: () => boolean; // toggles whether non-admins use this voting system
  addVoteClient: (props: {
    voteType: string | null;
    document: VoteableTypeClient;
    oldExtendedScore: ExtendedScoreType;
    extendedVote: ExtendedVoteType;
    currentUser: UsersCurrent;
  }) => ExtendedScoreType;
  cancelVoteClient: (props: {
    voteType: string | null;
    document: VoteableTypeClient;
    oldExtendedScore: ExtendedScoreType;
    cancelledExtendedVote: ExtendedVoteType;
    currentUser: UsersCurrent;
  }) => ExtendedScoreType;
  computeExtendedScore: (votes: DbVote[], context: ResolverContext) => Promise<ExtendedScoreType>;
  isAllowedExtendedVote?: (args: { user: UsersCurrent | DbUser; document: DbVoteableType; oldExtendedScore: ExtendedScoreType; extendedVote: ExtendedVoteType; skipRateLimits?: boolean; }) => { allowed: true; } | { allowed: false; reason: string; };
  isNonblankExtendedVote: (vote: DbVote) => boolean;
  getCommentHighlights?: (props: {
    comment: CommentsList;
    voteProps: VotingProps<VoteableTypeClient>;
  }) => ContentReplacedSubstringComponentInfo[];
  getPostHighlights?: (props: {
    post: PostsBase;
    voteProps: VotingProps<VoteableTypeClient>;
  }) => ContentReplacedSubstringComponentInfo[];
  getTagOrLensHighlights?: (props: {
    tagOrLens: TagLens | TagPageFragment;
    voteProps: VotingProps<VoteableTypeClient>;
  }) => ContentReplacedSubstringComponentInfo[];
}export type ReactBallotAxis = {
  name: string;
  scoreLabel: string;
  goodLabel: string;
  badLabel: string;
};
export type ReactBallotStandaloneReaction = {
  name: string;
  label: string;
  icon: string;
};
export type EmojiReactionType = {
  name: string;
  icon: string;
};

