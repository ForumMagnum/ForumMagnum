import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, CommentVotingComponent, getVotingSystemByName } from '../../lib/votingSystems';

interface  SmallSideVoteProps extends CommentVotingComponentProps {
  classes: ClassesType
}

const SmallSideVote = ({document, hideKarma=false, collection}: SmallSideVoteProps) => {
  const votingSystemName = (document as any)?.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  
  const VotingComponent = votingSystem.getCommentVotingComponent();
  return <VotingComponent
    document={document}
    hideKarma={hideKarma}
    collection={collection}
  />
}

const SmallSideVoteComponent = registerComponent('SmallSideVote', SmallSideVote);

declare global {
  interface ComponentTypes {
    SmallSideVote: typeof SmallSideVoteComponent
  }
}
