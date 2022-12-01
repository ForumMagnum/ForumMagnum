import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    whiteSpace: "nowrap",
  },
  agreementSection: {
    display: "inline-block",
    fontSize: 25,
    marginLeft: 8,
    lineHeight: 0.6,
    height: 24,
    minWidth: 70,
    paddingTop: 2,
    outline: theme.palette.border.commentBorder,
    textAlign: 'center'
  },
  agreementScore: {
    fontSize: "1.1rem",
    marginLeft: 4,
    lineHeight: 1,
    marginRight: 4,
  },
});

interface TwoAxisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType
}

const TwoAxisVoteOnComment = ({document, hideKarma=false, collection, votingSystem, classes}: TwoAxisVoteOnCommentProps) => {
  const voteProps = useVote(document, collection.options.collectionName, votingSystem);
  const { OverallVoteAxis, AgreementVoteAxis } = Components;

  let documentTypeName = "comment";
  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }
  
  return <span className={classes.root}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      showBox={true}
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
