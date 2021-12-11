import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';


const VoteOnComment = ({document, hideKarma=false, collection, votingSystem}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  return <Components.VoteAxis
    document={document}
    hideKarma={hideKarma}
    voteProps={voteProps}
  />
}


const VoteOnCommentComponent = registerComponent('VoteOnComment', VoteOnComment);

declare global {
  interface ComponentTypes {
    VoteOnComment: typeof VoteOnCommentComponent
  }
}
