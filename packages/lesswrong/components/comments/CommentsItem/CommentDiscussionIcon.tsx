import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  icon: {
    color: theme.palette.grey[500],
    width: 20,
    height: 20,
    marginRight: 8,
    position: "relative",
    top: 3
  },
  smallIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    top: 2
  }
});

const CommentDiscussionIcon = ({comment, small = false, classes}: {
  comment: CommentsList,
  small?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { LWTooltip } = Components
  if (comment.tagCommentType !== "SUBFORUM" || comment.topLevelCommentId) return null

  return (
    <LWTooltip title="Discussion">
      <QuestionAnswerIcon className={classNames(classes.icon, {[classes.smallIcon]: small})} />
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

