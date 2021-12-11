import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, CommentVotingComponent, getVotingSystemByName } from '../../lib/voting/votingSystems';

const SmallSideVote = ({document, hideKarma=false, collection}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collection: any,
}) => {
  const votingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  
  const VotingComponent = votingSystem.getCommentVotingComponent();
  return <VotingComponent
    document={document}
    hideKarma={hideKarma}
    collection={collection}
    votingSystem={votingSystem}
  />
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote);

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}
