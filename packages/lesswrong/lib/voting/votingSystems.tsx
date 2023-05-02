import React from 'react';
import { Components } from '../vulcan-lib/components';
import { calculateVotePower } from './voteTypes';
import { loadByIds } from '../loaders';
import { filterNonnull } from '../utils/typeGuardUtils';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import pickBy from 'lodash/pickBy';
import fromPairs from 'lodash/fromPairs';
import mapValues from 'lodash/mapValues';

export type CommentVotingComponentProps = {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collection: any,
  votingSystem: VotingSystem,
}
export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;

export interface VotingSystem {
  name: string,
  description: string,
  getCommentVotingComponent: ()=>CommentVotingComponent,
  getCommentBottomComponent?: ()=>CommentVotingComponent,
  addVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: any,
    extendedVote: any,
    currentUser: UsersCurrent
  })=>any,
  cancelVoteClient: (props: {
    voteType: string|null,
    document: VoteableTypeClient,
    oldExtendedScore: any,
    cancelledExtendedVote: any,
    currentUser: UsersCurrent
  })=>any
  computeExtendedScore: (votes: DbVote[], context: ResolverContext)=>Promise<any>
  isNonblankExtendedVote: (vote: DbVote) => boolean,
}

const votingSystems: Partial<Record<string,VotingSystem>> = {};

const registerVotingSystem = (votingSystem: VotingSystem) => {
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
  description: "Two-Axis Approve and Agree",
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

function getVoteAxisStrength(vote: DbVote, usersById: Record<string,DbUser>, axis: string) {
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

registerVotingSystem({
  name: "namesAttachedReactions",
  description: "Names-attached reactions",
  getCommentVotingComponent: () => Components.NamesAttachedReactionsVoteOnComment,
  getCommentBottomComponent: () => Components.NamesAttachedReactionsCommentBottom,
  addVoteClient: ({voteType, document, oldExtendedScore, extendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: AnyBecauseTodo, extendedVote: AnyBecauseTodo, currentUser: UsersCurrent}): AnyBecauseTodo => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const newVoteIncludesApproval = (voteType&&voteType!=="neutral");
    const newReacts = addReactsVote(oldExtendedScore?.reacts, extendedVote?.reacts, currentUser);
    
    return {
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) + newAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) + 1,
      reacts: newReacts,
    };
  },
  cancelVoteClient: ({voteType, document, oldExtendedScore, cancelledExtendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const oldVoteAgreement: string | undefined = cancelledExtendedVote?.agreement;
    const oldVoteIncludesAgreement = (oldVoteAgreement && oldVoteAgreement!=="neutral");
    const oldAgreementPower = oldVoteIncludesAgreement ? calculateVotePower(currentUser.karma, oldVoteAgreement) : 0;
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const oldVoteIncludesApproval = (voteType&&voteType!=="neutral");
    const newReacts = removeReactsVote(oldExtendedScore?.reacts, currentUser);
    
    return {
      approvalVoteCount: oldApprovalVoteCount - (oldVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) - (oldVoteIncludesAgreement?oldAgreementPower:0),
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) - (oldVoteIncludesAgreement?1:0),
      reacts: newReacts,
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    let mergedReacts: NamesAttachedReactionsList = {};
    for (let vote of votes) {
      const userInfo: UserReactInfo = {
        userId: vote.userId,
        displayName: usersById[vote.userId].displayName,
        karma: usersById[vote.userId].karma,
      };
      if (vote.extendedVoteType?.reacts) {
        for (let reaction of vote.extendedVoteType?.reacts) {
          if (mergedReacts[reaction]) {
            mergedReacts[reaction]!.push(userInfo);
          } else {
            mergedReacts[reaction] = [userInfo];
          }
        }
      }
    }
    
    const result = {
      approvalVoteCount: votes.filter(v=>(v.voteType && v.voteType!=="neutral")).length,
      agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      agreementVoteCount: votes.filter(v=>getVoteAxisStrength(v, usersById, "agreement") !== 0).length,
      reacts: mergedReacts,
    };
    return result;
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    return (vote?.extendedVoteType?.agreement && vote.extendedVoteType.agreement !== "neutral")
      || (vote?.extendedVoteType?.reacts && vote.extendedVoteType.reacts.length>0);
  },
});

type EmojiReactName = string;
export type NamesAttachedReactionsVote = EmojiReactName[];
type UserReactInfo = {
  userId: string
  displayName: string
  karma: number
}
export type NamesAttachedReactionsList = {
  [reactionType: EmojiReactName]: UserReactInfo[]|undefined
};

function addReactsVote(old: NamesAttachedReactionsList|undefined, voteReacts: NamesAttachedReactionsVote|undefined, currentUser: UsersCurrent): NamesAttachedReactionsList {
  let updatedReactions = removeReactsVote(old, currentUser);
  const userInfo = {
    userId: currentUser._id,
    displayName: currentUser.displayName,
    karma: currentUser.karma,
  };
  if (voteReacts) {
    for (let reaction of voteReacts) {
      if (updatedReactions[reaction])
        updatedReactions[reaction] = [...updatedReactions[reaction]!, userInfo];
      else
        updatedReactions[reaction] = [userInfo];
    }
  }
  return updatedReactions;
}

function removeReactsVote(old: NamesAttachedReactionsList|undefined, currentUser: UsersCurrent): NamesAttachedReactionsList {
  let updatedReactions: NamesAttachedReactionsList = old ? mapValues(old,
    (reactionsByType: UserReactInfo[]) => (
      reactionsByType.filter(userIdAndName => userIdAndName.userId !== currentUser._id)
    )
  ) : {};
  return updatedReactions;
}


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


