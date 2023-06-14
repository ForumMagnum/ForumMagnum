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

export type CommentVotingComponentProps = {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collection: any,
  votingSystem: VotingSystem,
  commentItemRef?: React.RefObject<HTMLDivElement>|null,
  // setCommentBodyHighlights?: (highlights: string[])=>void,
  quote?: string
}
export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;

export interface VotingSystem<ExtendedVoteType=any, ExtendedScoreType=any> {
  name: string,
  description: string,
  userCanActivate?: boolean, // toggles whether non-admins use this voting system
  getCommentVotingComponent: ()=>CommentVotingComponent,
  getCommentBottomComponent?: ()=>CommentVotingComponent,
  addVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: ExtendedScoreType,
    extendedVote: ExtendedVoteType,
    currentUser: UsersCurrent
  })=>ExtendedScoreType,
  cancelVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: ExtendedScoreType,
    cancelledExtendedVote: ExtendedVoteType,
    currentUser: UsersCurrent
  })=>ExtendedScoreType
  computeExtendedScore: (votes: DbVote[], context: ResolverContext)=>Promise<ExtendedScoreType>
  isAllowedExtendedVote?: (user: UsersCurrent|DbUser, document: DbVoteableType, oldExtendedScore: ExtendedScoreType, extendedVote: ExtendedVoteType) => {allowed: true}|{allowed: false, reason: string},
  isNonblankExtendedVote: (vote: DbVote) => boolean,
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

export type ReactBallotAxis = {
  name: string,
  scoreLabel: string,
  goodLabel: string,
  badLabel: string,
}
export type ReactBallotStandaloneReaction = {
  name: string,
  label: string,
  icon: string,
}
export const reactBallotAxes: ReactBallotAxis[] = [
  {name: "truth", scoreLabel: "Truth", goodLabel: "True", badLabel: "False"},
  {name: "aim", scoreLabel: "Aim", goodLabel: "Hits the Mark", badLabel: "Misses the Point"},
  {name: "clarity", scoreLabel: "Clarity", goodLabel: "Clear", badLabel: "Muddled"},
  {name: "seeking", scoreLabel: "Seeking",goodLabel: "Seeks Truth", badLabel: "Seeks Conflict"},
];
export const reactBallotStandaloneReactions: ReactBallotStandaloneReaction[] = [
  {name: "skepticism", label: "Skepticism", icon: "🤨"},
  {name: "enthusiasm", label: "Enthusiasm", icon: "🎉"},
  {name: "empathy",    label: "Empathy",    icon: "❤️"},
  {name: "surprise",   label: "Surprise",   icon: "😮"},
]

const reactBallotAxisNames = reactBallotAxes.map(axis=>axis.name);
const reactBallotStandaloneReactionNames = reactBallotStandaloneReactions.map(reaction => reaction.name);

registerVotingSystem({
  name: "reactsBallot",
  description: "React-Ballots",
  getCommentVotingComponent: () => Components.ReactBallotVoteOnComment,
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent}): any => {
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      const axisPower = calculateVotePower(currentUser.karma, extendedVote?.[axis]||"neutral");
      return [axis, (oldExtendedScore?.[axis]||0) + axisPower];
    }));
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      const hasReaction = !!extendedVote?.[reaction];
      return [reaction, (oldExtendedScore?.[reaction]||0) + (hasReaction?1:0)];
    }));
    return filterZeroes({...axisScores, ...standaloneReactCounts});
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      const oldVote: string | undefined = cancelledExtendedVote?.[axis];
      const oldScore = (oldExtendedScore?.[axis]||0);
      if (!oldVote || oldVote==="neutral") return [axis, oldScore];
      const oldAxisPower = calculateVotePower(currentUser.karma, oldVote);
      return [axis, oldScore - oldAxisPower];
    }));
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      return [reaction, oldExtendedScore?.[reaction] - (oldVote?1:0)];
    }));
    return filterZeroes({...axisScores, ...standaloneReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      return [axis, sumBy(votes, v => getVoteAxisStrength(v, usersById, axis))];
    }))
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      return [reaction, sumBy(votes, v => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    
    return filterZeroes({ ...axisScores, ...standaloneReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) return false;
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key]!=="neutral")
        return true;
    }
    return false;
  },
});

export type EmojiReaction = {
  name: string,
  icon: string,
}
export const emojiReactions: EmojiReaction[] = [
  {name: "raised-hands", icon: "🙌"},
  {name: "enthusiasm", icon: "🎉"},
  {name: "empathy", icon: "❤️"},
  {name: "star", icon: "🌟"},
  {name: "surprise", icon: "😮"},
]
const emojiReactionNames = emojiReactions.map(reaction => reaction.name)

registerVotingSystem({
  name: "emojiReactions",
  description: "Emoji reactions",
  getCommentVotingComponent: () => Components.EmojiReactionVoteOnComment,
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent}): any => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      const hasReaction = !!extendedVote?.[reaction];
      return [reaction, (oldExtendedScore?.[reaction]||0) + (hasReaction?1:0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      return [reaction, oldExtendedScore?.[reaction] - (oldVote?1:0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      return [reaction, sumBy(votes, v => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    
    return filterZeroes({...emojiReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) return false;
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key]!=="neutral")
        return true;
    }
    return false;
  },
});

const getEmojiReactionPower = (value?: boolean) => {
  switch (value) {
  case true:
    return 1;
  case false:
    return -1;
  default:
    return 0;
  }
}

registerVotingSystem({
  name: "threeAxisEmojis",
  description: "Two-axis approve and agree, plus emoji reactions",
  getCommentVotingComponent: () => Components.ThreeAxisEmojisVoteOnComment,
  addVoteClient: ({oldExtendedScore, extendedVote}: {
    oldExtendedScore?: Record<string, number>,
    extendedVote?: Record<string, boolean>,
    currentUser: UsersCurrent,
  }): Record<string, number> => {
    const emojiReactCounts = fromPairs(eaEmojiNames.map((reaction) => {
      const power = getEmojiReactionPower(extendedVote?.[reaction]);
      return [reaction, (oldExtendedScore?.[reaction] || 0) + power];
    }));
    return filterZeroes({...emojiReactCounts});
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
  if (votingSystems[name])
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
    const post = await context.loaders.Posts.load((document as DbComment).postId);
    if (post?.votingSystem) {
      return post.votingSystem;
    }
  }
  return "default";
}

export async function getVotingSystemForDocument(document: VoteableType, context: ResolverContext) {
  return getVotingSystemByName(await getVotingSystemNameForDocument(document, context));
}


