import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    color: theme.palette.grey[500],
    width: 15,
    height: 15,
    marginRight: 6,
    position: "relative",
    top: 2
  }
});

const CommentDiscussionIcon = ({comment, classes}: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const { LWTooltip } = Components
  if (comment.tagCommentType !== "SUBFORUM" || comment.topLevelCommentId) return null

  return (
    <LWTooltip title="Discussion">
      <QuestionAnswerIcon className={classes.icon} />
    </LWTooltip>
  )
}

const CommentDiscussionIconComponent = registerComponent(
  'CommentDiscussionIcon', CommentDiscussionIcon, {styles}
);

declare global {
  interface ComponentTypes {
    CommentDiscussionIcon: typeof CommentDiscussionIconComponent,
  }
}

