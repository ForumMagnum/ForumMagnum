'use client';
import React from 'react';
import { CommentVotingComponentProps } from '@/lib/voting/votingSystemTypes';
import { useVote } from './withVote';
import OverallVoteAxis from "./OverallVoteAxis";

const VoteOnComment = ({document, hideKarma=false, collectionName, votingSystem}: CommentVotingComponentProps) => {
  const voteProps = useVote(document, collectionName, votingSystem);
  return <OverallVoteAxis
    document={document}
    hideKarma={hideKarma}
    voteProps={voteProps}
    showBox={false}
  />
}

export default VoteOnComment;
