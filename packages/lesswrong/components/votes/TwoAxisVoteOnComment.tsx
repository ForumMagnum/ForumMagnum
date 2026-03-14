'use client';

import React from 'react';
import { CommentVotingComponentProps } from '@/lib/voting/votingSystemTypes';
import { useVote } from './withVote';
import OverallVoteAxis from "./OverallVoteAxis";
import AgreementVoteAxis from "./AgreementVoteAxis";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('TwoAxisVoteOnComment', (theme: ThemeType) => ({
  root: {
    whiteSpace: "nowrap",
  },
}));

const TwoAxisVoteOnComment = ({document, hideKarma=false, collectionName, votingSystem}: CommentVotingComponentProps) => {
  const classes = useStyles(styles);
  const voteProps = useVote(document, collectionName, votingSystem);
  return <span className={classes.root}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      showBox
    />
    <AgreementVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
    />
  </span>
}


export default TwoAxisVoteOnComment;


