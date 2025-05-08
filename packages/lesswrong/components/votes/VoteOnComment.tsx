import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';


const VoteOnCommentInner = ({document, hideKarma=false, collectionName, votingSystem}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collectionName, votingSystem);
  return <Components.OverallVoteAxis
    document={document}
    hideKarma={hideKarma}
    voteProps={voteProps}
    showBox={false}
  />
}


export const VoteOnComment = registerComponent('VoteOnComment', VoteOnCommentInner);

declare global {
  interface ComponentTypes {
    VoteOnComment: typeof VoteOnComment
  }
}
