import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: 6,
    background: theme.palette.grey[405],
  },
  bigUpvote: {
    background: theme.palette.primary.dark
  },
  smallUpvote: {
    background: theme.palette.primary.light
  },
  bigDownvote: {
    background: theme.palette.error.dark
  },
  smallDownvote: {
    background: theme.palette.error.light
  },
});

const voteMap: AnyBecauseTodo = {
  'bigDownvote': 'a strong (karma) downvote',
  'smallDownvote': 'a (karma) downvote',
  'smallUpvote': 'a (karma) upvote',
  'bigUpvote': 'a strong (karma) upvote'
}

export const KarmaVoteStripe = ({classes, post}: {
  classes: ClassesType,
  post: PostsListWithVotes
}) => {
  const { LWTooltip } = Components
  if (!post.currentUserVote) return null

  return <LWTooltip title={`You previously gave this post ${voteMap[post.currentUserVote]}`} placement="left" inlineBlock={false}>
    <div className={classNames(classes.root, classes[post.currentUserVote])}/>
  </LWTooltip>
}

const KarmaVoteStripeComponent = registerComponent('KarmaVoteStripe', KarmaVoteStripe, {styles});

declare global {
  interface ComponentTypes {
    KarmaVoteStripe: typeof KarmaVoteStripeComponent
  }
}

