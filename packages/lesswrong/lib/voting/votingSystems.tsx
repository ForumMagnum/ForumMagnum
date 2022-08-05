import React from 'react';
import { Components } from '../vulcan-lib/components';
import { calculateVotePower } from './voteTypes';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import pickBy from 'lodash/pickBy';
import fromPairs from 'lodash/fromPairs';

export type VoteWidgetOptions = {
  /**
   * Hide the karma score. Used if the `hideCommentKarma` option is set on a post.
   */
  hideKarma?: boolean,
  
  /**
   * Offset the displayed karma by a given amount. Used in tag contributor lists,
   * when you're voting on the user's most recent revision but the displayed score
   * is the sum of all of the revisions they've made to the tag.
   */
  displayKarmaOffset?: number,
  
  /**
   * Tooltip for when score is hovered. Optional, if provided overrides the
   * default.
   */
  scoreTooltip?: (props: {baseScore: number, voteCount: number})=>React.ReactNode,
}

export type CommentVotingComponentProps = {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  options: VoteWidgetOptions,
  collection: any,
  votingSystem: VotingSystem,
}
export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;

export interface VotingSystem {
  name: string,
  description: string,
  getCommentVotingComponent: ()=>CommentVotingComponent,
  addVoteClient: (oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent)=>any,
  cancelVoteClient: (oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent)=>any
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
  addVoteClient: (oldExtendedScore, extendedVote: any, currentUser: UsersCurrent): any => {
    return null;
  },
  cancelVoteClient: (oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent): any => {
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
  addVoteClient: (oldExtendedScore, extendedVote: any, currentUser: UsersCurrent): any => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    return {
      agreement: (oldExtendedScore?.agreement||0) + newAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) + 1,
    };
  },
  cancelVoteClient: (oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent): any => {
    const oldVote = cancelledExtendedVote?.agreement;
    if (!oldVote || oldVote==="neutral") return oldExtendedScore;
    const oldAgreementPower = calculateVotePower(currentUser.karma, oldVote);
    return {
      agreement: (oldExtendedScore?.agreement||0) - oldAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) - 1,
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await context.loaders.Users.loadMany(userIdsThatVoted);
    const usersById = keyBy(usersThatVoted, u=>u._id);
    
    const result = {
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
  const voteType = vote.extendedVoteType?.[axis];
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
  addVoteClient: (oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent): any => {
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
  cancelVoteClient: (oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent): any => {
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      const oldVote = cancelledExtendedVote?.[axis];
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
    const usersThatVoted = await context.loaders.Users.loadMany(userIdsThatVoted);
    const usersById = keyBy(usersThatVoted, u=>u._id);
    
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

export async function getVotingSystemForDocument(document: VoteableType, context: ResolverContext) {
  if ((document as DbComment).postId) {
    const post = await context.loaders.Posts.load((document as DbComment).postId);
    if (post?.votingSystem) {
      return await getVotingSystemByName(post.votingSystem);
    }
  }
  return getDefaultVotingSystem();
}


