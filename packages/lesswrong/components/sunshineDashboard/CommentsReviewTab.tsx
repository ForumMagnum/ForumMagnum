import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentWithModeratorActions, CommentsReviewInfoCard } from './CommentsReviewInfoCard';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const CommentsReviewTabInner = ({commentsWithActions, classes}: {
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

export const CommentsReviewTab = registerComponent('CommentsReviewTab', CommentsReviewTabInner, {styles});

declare global {
  interface ComponentTypes {
    CommentsReviewTab: typeof CommentsReviewTab
  }
}
