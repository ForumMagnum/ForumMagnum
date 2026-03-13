import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import QuestionAnswerIcon from '@/lib/vendor/@material-ui/icons/src/QuestionAnswer';
import classNames from 'classnames';
import LWTooltip from "../../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('CommentDiscussionIcon', (theme: ThemeType) => ({
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
}));

const CommentDiscussionIcon = ({comment, small = false}: {
  comment: CommentsList,
  small?: boolean,
}) => {
  const classes = useStyles(styles);

  if (comment.tagCommentType !== "SUBFORUM" || comment.topLevelCommentId) return null

  return (
    <LWTooltip title="Discussion">
      <QuestionAnswerIcon className={classNames(classes.icon, {[classes.smallIcon]: small})} />
    </LWTooltip>
  )
}

export default registerComponent(
  'CommentDiscussionIcon', CommentDiscussionIcon, {styles}
);



