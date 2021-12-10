import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/votingSystems';
import { useVote } from './withVote';


const VoteOnComment = ({document, hideKarma=false, collection}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collection.options.collectionName);
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
