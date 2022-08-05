import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, CommentVotingComponent, getVotingSystemByName, VoteWidgetOptions } from '../../lib/voting/votingSystems';

const SmallSideVote = ({document, options, collection}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  options: VoteWidgetOptions,
  collection: any,
}) => {
  const votingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  
  const VotingComponent = votingSystem.getCommentVotingComponent();
  return <VotingComponent
    document={document}
    options={options}
    collection={collection}
    votingSystem={votingSystem}
  />
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote, {areEqual: "auto"});

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}
