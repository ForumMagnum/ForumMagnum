import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CommentsNodeInner from "../comments/CommentsNode";
import RejectedContentControls from "./RejectedContentControls";
import ForumIcon from "../common/ForumIcon";
import SunshineNewUserCommentItem from "./SunshineNewUserCommentItem";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: theme.spacing.unit,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
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
})

const SunshineNewUserCommentsList = ({comments, user, classes}: {
  comments?: Array<CommentsListWithParentMetadata>,
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {

  if (!comments) return null;

  const newComments = user.reviewedAt ? comments.filter(comment => comment.postedAt > user.reviewedAt!) : comments;

  return (
    <div className={classes.root}>
      {newComments.length > 0 && newComments.map(comment => <SunshineNewUserCommentItem key={`sunshine-new-user-${comment._id}`} comment={comment} />)}
    </div>
  )
}

export default registerComponent('SunshineNewUserCommentsList', SunshineNewUserCommentsList, {styles});


