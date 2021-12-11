import React from 'react';
import { Components } from '../vulcan-lib/components';
import { calculateVotePower } from './voteTypes';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';

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
  addVoteClient: (document: VoteableTypeClient, extendedVote: any, currentUser: UsersCurrent)=>any,
  cancelVoteClient: (document: VoteableTypeClient, currentUser: UsersCurrent)=>any
  computeDocumentScores: (votes: DbVote[], context: ResolverContext)=>Promise<{baseScore: number, extendedScore: any}>
}

const votingSystems: Partial<Record<string,VotingSystem>> = {};

const registerVotingSystem = (votingSystem: VotingSystem) => {
  votingSystems[votingSystem.name] = votingSystem;
}

registerVotingSystem({
  name: "default",
  description: "Reddit-style up/down with strongvotes",
  getCommentVotingComponent: () => Components.VoteOnComment,
  addVoteClient: (document: VoteableTypeClient, extendedVote: any, currentUser: UsersCurrent): any => {
    return null;
  },
  cancelVoteClient: (document: VoteableTypeClient, currentUser: UsersCurrent): any => {
    return null;
  },
  computeDocumentScores: async (votes: DbVote[], context: ResolverContext) => {
    return {
      baseScore: sumBy(votes, v=>v.power),
      extendedScore: null,
    };
  }
});

registerVotingSystem({
  name: "twoAxis",
  description: "Two-Axis Approve and Agree",
  getCommentVotingComponent: () => Components.TwoAxisVoteOnComment,
  addVoteClient: (document: VoteableTypeClient, extendedVote: any, currentUser: UsersCurrent): any => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    return {
      agreement: (document.extendedScore?.agreement||0) + newAgreementPower,
    };
  },
  cancelVoteClient: (document: VoteableTypeClient, currentUser: UsersCurrent): any => {
    const oldVote = document.currentUserExtendedVote?.agreement;
    if (!oldVote || oldVote==="neutral") return document;
    const oldAgreementPower = calculateVotePower(currentUser.karma, oldVote);
    return {
      agreement: (document.extendedScore?.agreement||0) - oldAgreementPower,
    };
  },
  computeDocumentScores: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await context.loaders.Users.loadMany(userIdsThatVoted);
    const usersById = keyBy(usersThatVoted, u=>u._id);
    
    const result = {
      baseScore: sumBy(votes, v=>v.power),
      extendedScore: {
        agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      }
    };
    return result;
  }
});

function getVoteAxisStrength(vote: DbVote, usersById: Record<string,DbUser>, axis: string) {
  const voteType = vote.extendedVoteType?.[axis];
  if (!voteType) return 0;
  const user = usersById[vote.userId];
  return calculateVotePower(user.karma, voteType);
}

/*registerVotingSystem({
  name: "reactsBallot",
  description: "React-Ballots",
  getCommentVotingComponent: 
  addVoteClient: 
  cancelVoteClient: 
  computeDocumentScores: 
});*/

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


