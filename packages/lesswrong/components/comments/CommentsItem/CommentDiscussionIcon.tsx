import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import QuestionAnswerIcon from '@/lib/vendor/@material-ui/icons/src/QuestionAnswer';
import classNames from 'classnames';
import { LWTooltip } from "../../common/LWTooltip";

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

const CommentDiscussionIconInner = ({comment, small = false, classes}: {
  comment: CommentsList,
  small?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  if (comment.tagCommentType !== "SUBFORUM" || comment.topLevelCommentId) return null

  return (
    <LWTooltip title="Discussion">
      <QuestionAnswerIcon className={classNames(classes.icon, {[classes.smallIcon]: small})} />
    </LWTooltip>
  )
}

export const CommentDiscussionIcon = registerComponent(
  'CommentDiscussionIcon', CommentDiscussionIconInner, {styles}
);

declare global {
  interface ComponentTypes {
    CommentDiscussionIcon: typeof CommentDiscussionIcon,
  }
}

