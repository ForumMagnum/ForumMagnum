import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';
import { commentVotingComponents } from '@/lib/voting/votingSystemComponents';
import type { VotingSystemName } from '@/lib/voting/votingSystemNames';

const SmallSideVote = ({document, hideKarma=false, collectionName}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics,
  hideKarma?: boolean,
  collectionName: VoteableCollectionName,
}) => {
  const votingSystemName: VotingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);

  const VotingComponent = commentVotingComponents[votingSystemName]();
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


