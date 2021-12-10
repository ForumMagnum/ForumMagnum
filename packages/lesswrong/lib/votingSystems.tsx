import React from 'react';
import { Components } from './vulcan-lib/components';

export type CommentVotingComponentProps = {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collection: any
}
export type CommentVotingComponent = React.ComponentType<CommentVotingComponentProps>;

interface VotingSystem {
  name: string,
  description: string,
  getCommentVotingComponent: ()=>CommentVotingComponent,
}

const votingSystems: Partial<Record<string,VotingSystem>> = {};

const registerVotingSystem = (votingSystem: VotingSystem) => {
  votingSystems[votingSystem.name] = votingSystem;
}

registerVotingSystem({
  name: "default",
  description: "Reddit-style up/down with strongvotes",
  getCommentVotingComponent: () => Components.VoteOnComment,
});

registerVotingSystem({
  name: "twoAxis",
  description: "Two-Axis Approve and Agree",
  getCommentVotingComponent: () => Components.TwoAxisVoteOnComment,
});

registerVotingSystem({
  name: "reactsBallot",
  description: "React-Ballots",
  getCommentVotingComponent: () => Components.VoteOnComment, //TODO
});

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
