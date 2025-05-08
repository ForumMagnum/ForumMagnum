import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';

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
  const { OverallVoteAxis, AgreementVoteAxis } = Components;
  
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
