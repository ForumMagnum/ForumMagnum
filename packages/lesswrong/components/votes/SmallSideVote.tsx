import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';

const SmallSideVote = ({document, hideKarma=false, collectionName}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collectionName: VoteableCollectionName,
}) => {
  const votingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);

  const VotingComponent = votingSystem.getCommentVotingComponent?.();
  return VotingComponent
    ? (
      <VotingComponent
        document={document}
        hideKarma={hideKarma}
        collectionName={collectionName}
        votingSystem={votingSystem}
      />
    )
    : null;
}

export default registerComponent('SmallSideVote', SmallSideVote, {areEqual: "auto"});


