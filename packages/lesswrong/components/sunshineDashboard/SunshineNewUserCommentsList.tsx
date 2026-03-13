import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { SunshineNewUserCommentItem } from "./SunshineNewUserCommentItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SunshineNewUserCommentsList', (theme: ThemeType) => ({
  root: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    flexDirection: "column",
  },
  comment: {
    marginBottom: 16,
    marginTop: 16,
  },
  meta: {
    display: "inline-block"
  },
  rejection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandCollapseButton: {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
    color: theme.palette.grey[600],
  },
}))

const SunshineNewUserCommentsList = ({comments, user}: {
  comments?: Array<CommentsListWithParentMetadata>,
  user: SunshineUsersList
}) => {
  const classes = useStyles(styles);

  if (!comments) return null;

  const newComments = user.reviewedAt ? comments.filter(comment => comment.postedAt > user.reviewedAt!) : comments;

  return (
    <div className={classes.root}>
      {newComments.length > 0 && newComments.map(comment => <SunshineNewUserCommentItem key={`sunshine-new-user-${comment._id}`} comment={comment} />)}
    </div>
  )
}

export default SunshineNewUserCommentsList


