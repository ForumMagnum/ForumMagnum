import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import { OverallVoteAxis } from "./OverallVoteAxis";
import { AgreementVoteAxis } from "./AgreementVoteAxis";

const styles = (theme: ThemeType) => ({
  root: {
    whiteSpace: "nowrap",
  },
});

interface TwoAxisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType<typeof styles>
}

const TwoAxisVoteOnCommentInner = ({document, hideKarma=false, collectionName, votingSystem, classes}: TwoAxisVoteOnCommentProps) => {
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


export const TwoAxisVoteOnComment = registerComponent('TwoAxisVoteOnComment', TwoAxisVoteOnCommentInner, {styles});

declare global {
  interface ComponentTypes {
    TwoAxisVoteOnComment: typeof TwoAxisVoteOnComment
  }
}
