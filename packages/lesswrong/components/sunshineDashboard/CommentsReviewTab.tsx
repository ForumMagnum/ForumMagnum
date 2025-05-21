import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import CommentsReviewInfoCard, { CommentWithModeratorActions } from './CommentsReviewInfoCard';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const CommentsReviewTab = ({commentsWithActions, classes}: {
  commentsWithActions: CommentWithModeratorActions[],
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.root}>
    {commentsWithActions.map(commentWithActions =>
      <CommentsReviewInfoCard
        key={commentWithActions.comment._id}
        commentModeratorAction={commentWithActions}
      />
    )}
  </div>;
}

export default registerComponent('CommentsReviewTab', CommentsReviewTab, {styles});


