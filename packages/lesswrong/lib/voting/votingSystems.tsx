import React from 'react';
import { Components } from '../vulcan-lib/components';
import { calculateVotePower } from './voteTypes';
import { eaEmojiNames } from './eaEmojiPalette';
import { loadByIds } from '../loaders';
import { filterNonnull } from '../utils/typeGuardUtils';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import pickBy from 'lodash/pickBy';
import fromPairs from 'lodash/fromPairs';
import { VotingProps } from '../../components/votes/votingProps';
import type { ContentItemBody, ContentReplacedSubstringComponentInfo } from '../../components/common/ContentItemBody';

type VotingPropsDocument = CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics

export type CommentVotingComponentProps<T extends VotingPropsDocument = VotingPropsDocument> = {
  document: T,
  hideKarma?: boolean,
  collectionName: VoteableCollectionName,
  votingSystem: VotingSystem,
  commentBodyRef?: React.RefObject<ContentItemBody>|null,
  voteProps?: VotingProps<VoteableTypeClient>,
  post?: PostsWithNavigation | PostsWithNavigationAndRevision,
}
export interface NamesAttachedReactionsCommentBottomProps extends CommentVotingComponentProps<CommentsList> {
  voteProps: VotingProps<VoteableTypeClient>,
}

export type PostVotingComponentProps = {
  document: PostsWithVotes,
  votingSystem: VotingSystem,
  isFooter?: boolean,
}

export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;
export type CommentVotingBottomComponent = React.ComponentType<NamesAttachedReactionsCommentBottomProps>;
export type PostVotingComponent = React.ComponentType<PostVotingComponentProps>;

export interface VotingSystem<ExtendedVoteType=any, ExtendedScoreType=any> {
  name: string,
  description: string,
  userCanActivate?: boolean, // toggles whether non-admins use this voting system
  getCommentVotingComponent?: () => CommentVotingComponent,
  getCommentBottomComponent?: () => CommentVotingBottomComponent,
  getPostBottomVotingComponent?: () => PostVotingComponent,
  getPostBottomSecondaryVotingComponent?: () => PostVotingComponent,
  addVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: ExtendedScoreType,
    extendedVote: ExtendedVoteType,
    currentUser: UsersCurrent
  }) => ExtendedScoreType,
  cancelVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: ExtendedScoreType,
    cancelledExtendedVote: ExtendedVoteType,
    currentUser: UsersCurrent
  }) => ExtendedScoreType
  computeExtendedScore: (votes: DbVote[], context: ResolverContext) => Promise<ExtendedScoreType>
  isAllowedExtendedVote?: (user: UsersCurrent|DbUser, document: DbVoteableType, oldExtendedScore: ExtendedScoreType, extendedVote: ExtendedVoteType) => {allowed: true}|{allowed: false, reason: string},
  isNonblankExtendedVote: (vote: DbVote) => boolean,
  getCommentHighlights?: (props: {
    comment: CommentsList
    voteProps: VotingProps<VoteableTypeClient>
  }) => Record<string, ContentReplacedSubstringComponentInfo>
  getPostHighlights?: (props: {
    post: PostsBase
    voteProps: VotingProps<VoteableTypeClient>
  }) => Record<string, ContentReplacedSubstringComponentInfo>
}

const votingSystems: Partial<Record<string,VotingSystem>> = {};

export const registerVotingSystem = <V,S>(votingSystem: VotingSystem<V,S>) => {
  votingSystems[votingSystem.name] = votingSystem;
}

registerVotingSystem({
  name: "default",
  description: "Reddit-style up/down with strongvotes",
  getCommentVotingComponent: () => Components.VoteOnComment,
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: AnyBecauseTodo, extendedVote: AnyBecauseTodo, currentUser: UsersCurrent}): AnyBecauseTodo => {
    return null;
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    return null;
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    return null;
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    return false;
  },
});

registerVotingSystem({
  name: "twoAxis",
  description: "Default (Two-Axis Approve and Agree)",
  userCanActivate: true,
  getCommentVotingComponent: () => Components.TwoAxisVoteOnComment,
  addVoteClient: ({voteType, document, oldExtendedScore, extendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: AnyBecauseTodo, extendedVote: AnyBecauseTodo, currentUser: UsersCurrent}): AnyBecauseTodo => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const newVoteIncludesApproval = (voteType&&voteType!=="neutral");
    
    return {
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) + newAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) + 1,
    };
  },
  cancelVoteClient: ({voteType, document, oldExtendedScore, cancelledExtendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const oldVoteAgreement: string | undefined = cancelledExtendedVote?.agreement;
    const oldVoteIncludesAgreement = (oldVoteAgreement && oldVoteAgreement!=="neutral");
    const oldAgreementPower = oldVoteIncludesAgreement ? calculateVotePower(currentUser.karma, oldVoteAgreement) : 0;
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const oldVoteIncludesApproval = (voteType&&voteType!=="neutral");
    
    return {
      approvalVoteCount: oldApprovalVoteCount - (oldVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) - (oldVoteIncludesAgreement?oldAgreementPower:0),
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) - (oldVoteIncludesAgreement?1:0),
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    const result = {
      approvalVoteCount: votes.filter(v=>(v.voteType && v.voteType!=="neutral")).length,
      agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      agreementVoteCount: votes.filter(v=>getVoteAxisStrength(v, usersById, "agreement") !== 0).length,
    };
    return result;
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    return vote?.extendedVoteType?.agreement && vote.extendedVoteType.agreement !== "neutral";
  },
});

export function getVoteAxisStrength(vote: DbVote, usersById: Record<string,DbUser>, axis: string) {
  const voteType: string | undefined = vote.extendedVoteType?.[axis];
  if (!voteType) return 0;
  const user = usersById[vote.userId];
  return calculateVotePower(user.karma, voteType);
}

const getEmojiReactionPower = (value?: boolean) =>
  value === true ? 1 : 0;

registerVotingSystem({
  name: "eaEmojis",
  description: "Approval voting, plus EA Forum emoji reactions",
  getCommentVotingComponent: () => Components.EAEmojisVoteOnComment,
  getPostBottomVotingComponent: () => Components.EAEmojisVoteOnPost,
  getPostBottomSecondaryVotingComponent: () => Components.EAEmojisVoteOnPostSecondary,
  addVoteClient: ({oldExtendedScore, extendedVote, document, voteType}: {
    oldExtendedScore?: Record<string, number>,
    extendedVote?: Record<string, boolean>,
    currentUser: UsersCurrent,
    document: VoteableType,
    voteType: string | null,
  }): Record<string, number> => {
    const oldApprovalVoteCount =
      oldExtendedScore && "approvalVoteCount" in oldExtendedScore
        ? oldExtendedScore.approvalVoteCount
        : document.voteCount;
    const newVoteIncludesApproval = (voteType && voteType !== "neutral");
    const emojiReactCounts = fromPairs(eaEmojiNames.map((reaction) => {
      const power = getEmojiReactionPower(extendedVote?.[reaction]);
      return [reaction, (oldExtendedScore?.[reaction] || 0) + power];
    }));
    return {
      ...filterZeroes({...emojiReactCounts}),
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval ? 1 : 0),
    };
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote}: {
    oldExtendedScore?: Record<string, number>,
    cancelledExtendedVote?: Record<string, boolean>,
    currentUser: UsersCurrent,
  }): Record<string, number> => {
    const emojiReactCounts = fromPairs(eaEmojiNames.map((reaction) => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      const oldScore = oldExtendedScore?.[reaction] ?? 0;
      return [reaction, oldScore - (oldVote ? 1 : 0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], _context: ResolverContext) => {
    const emojiReactCounts = fromPairs(eaEmojiNames.map(reaction => {
      return [reaction, sumBy(votes, (v) => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    return filterZeroes({...emojiReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) {
      return false;
    }
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key] !== "neutral") {
        return true;
      }
    }
    return false;
  },
});

function filterZeroes(obj: any) {
  return pickBy(obj, v=>!!v);
}

export function getVotingSystemByName(name: string): VotingSystem {
  if (name && votingSystems[name])
    return votingSystems[name]!;
  else
    return getDefaultVotingSystem();
}

export function getDefaultVotingSystem(): VotingSystem {
  return votingSystems["default"]!;
}

export function getVotingSystems(): VotingSystem[] {
  return Object.keys(votingSystems).map(k => votingSystems[k]!);
}

export async function getVotingSystemNameForDocument(document: VoteableType, context: ResolverContext): Promise<string> {
  if ((document as DbComment).tagId) {
    return "twoAxis";
  }
  if ((document as DbComment).postId) {
    const post = await context.loaders.Posts.load((document as DbComment).postId!);
    if (post?.votingSystem) {
      return post.votingSystem;
    }
  }
  return (document as DbPost)?.votingSystem ?? "default";
}

export async function getVotingSystemForDocument(document: VoteableType, context: ResolverContext) {
  return getVotingSystemByName(await getVotingSystemNameForDocument(document, context));
}
