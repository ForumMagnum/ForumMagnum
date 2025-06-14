'use client';

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import OverallVoteAxis from "./OverallVoteAxis";
import AgreementVoteAxis from "./AgreementVoteAxis";

const styles = (theme: ThemeType) => ({
  root: {
    whiteSpace: "nowrap",
  },
});

interface TwoAxisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType<typeof styles>
}

const TwoAxisVoteOnComment = ({document, hideKarma=false, collectionName, votingSystem, classes}: TwoAxisVoteOnCommentProps) => {
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


export default registerComponent('TwoAxisVoteOnComment', TwoAxisVoteOnComment, {styles});


