import React from 'react';
import { getCollection, registerComponent } from '../../lib/vulcan-lib';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';

const SmallSideVote = ({document, hideKarma=false, collectionName}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collectionName: CollectionNameString,
}) => {
  const collection = getCollection(collectionName);
  const votingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);

  const VotingComponent = votingSystem.getCommentVotingComponent?.();
  return VotingComponent
    ? (
      <VotingComponent
        document={document}
        hideKarma={hideKarma}
        collection={collection}
        votingSystem={votingSystem}
      />
    )
    : null;
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote, {areEqual: "auto"});

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}
