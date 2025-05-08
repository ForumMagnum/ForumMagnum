import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentWithModeratorActions } from './CommentsReviewInfoCard';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const CommentsReviewTabInner = ({commentsWithActions, classes}: {
  commentsWithActions: CommentWithModeratorActions[],
  classes: ClassesType<typeof styles>,
}) => {
  const { CommentsReviewInfoCard } = Components;

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
