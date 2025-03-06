import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import OverallVoteAxis from "@/components/votes/OverallVoteAxis";
import AgreementVoteAxis from "@/components/votes/AgreementVoteAxis";

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


const TwoAxisVoteOnCommentComponent = registerComponent('TwoAxisVoteOnComment', TwoAxisVoteOnComment, {styles});

declare global {
  interface ComponentTypes {
    TwoAxisVoteOnComment: typeof TwoAxisVoteOnCommentComponent
  }
}

export default TwoAxisVoteOnCommentComponent;
