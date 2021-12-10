import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/votingSystems';
import { useVote } from './withVote';

const TwoAxisVoteOnComment = ({document, hideKarma=false, collection}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collection.options.collectionName);
  return <span>
    <Components.VoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
    />
  </span>
}


const TwoAxisVoteOnCommentComponent = registerComponent('TwoAxisVoteOnComment', TwoAxisVoteOnComment);

declare global {
  interface ComponentTypes {
    TwoAxisVoteOnComment: typeof TwoAxisVoteOnCommentComponent
  }
}
