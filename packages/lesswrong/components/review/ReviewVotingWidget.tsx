import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  root: {
    background: "white",
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    padding: 12,
    borderRadius: 2
  }
})

const ReviewVotingWidget = ({classes, post, dispatch}: {classes:ClassesType, post: PostsBase, dispatch: any}) => {

  const { ReviewVotingButtons } = Components

  return <div className={classes.root}>
      <p>Should this post be considered for the {2020} Review?</p>
      <ReviewVotingButtons postId={post._id} dispatch={dispatch} />
    </div>
}

const ReviewVotingWidgetComponent = registerComponent('ReviewVotingWidget', ReviewVotingWidget, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingWidget: typeof ReviewVotingWidgetComponent
  }
}