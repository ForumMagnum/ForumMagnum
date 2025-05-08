import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import { OverallVoteAxis } from "./OverallVoteAxis";

const VoteOnCommentInner = ({document, hideKarma=false, collectionName, votingSystem}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collectionName, votingSystem);
  return <OverallVoteAxis
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
