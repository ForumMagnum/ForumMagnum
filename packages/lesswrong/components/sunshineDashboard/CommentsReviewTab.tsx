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

  const { results } = useMulti({
    collectionName: 'CommentModeratorActions',
    fragmentName: 'CommentModeratorActionDisplay',
    terms: { view: 'activeCommentModeratorActions', limit: 10 }
  });

  return <div className={classes.root}>
    {results && results.map(commentModeratorAction =>
      <CommentsReviewInfoCard
        key={commentModeratorAction._id}
        commentModeratorAction={commentModeratorAction}
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
