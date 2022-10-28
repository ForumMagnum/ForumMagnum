import uniqBy from 'lodash/uniqBy';
import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const CommentsReviewTab = ({classes}: {
  classes: ClassesType,
}) => {
  const { CommentsReviewInfoCard } = Components;

  const { results = [] } = useMulti({
    collectionName: 'CommentModeratorActions',
    fragmentName: 'CommentModeratorActionDisplay',
    terms: { view: 'activeCommentModeratorActions', limit: 10 }
  });

  const allComments = results.map(result => result.comment);
  const uniqueComments = uniqBy(allComments, comment => comment._id);
  const commentsWithActions = uniqueComments.map(comment => {
    const actionsWithoutComment = results.filter(result => result.comment._id === comment._id).map(({ comment, ...remainingAction }) => remainingAction);
    return { comment, actions: actionsWithoutComment };
  });

  return <div className={classes.root}>
    {commentsWithActions.map(commentWithActions =>
      <CommentsReviewInfoCard
        key={commentWithActions.comment._id}
        commentModeratorAction={commentWithActions}
      />
    )}
  </div>;
}

const CommentsReviewTabComponent = registerComponent('CommentsReviewTab', CommentsReviewTab, {styles});

declare global {
  interface ComponentTypes {
    CommentsReviewTab: typeof CommentsReviewTabComponent
  }
}
