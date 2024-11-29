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
  readPost: {
    background: theme.palette.grey[405]
  }
});

const votePrefix = `You previously gave this post `

const interactionLabels: AnyBecauseTodo = {
  'bigDownvote': `${votePrefix}a strong (karma) downvote`,
  'smallDownvote': `${votePrefix}a (karma) downvote`,
  'smallUpvote': `${votePrefix}a (karma) upvote`,
  'bigUpvote': `${votePrefix}a strong (karma) upvote`,
  'readPost': `You have read this post`
}

export const PostInteractionStripe = ({classes, post}: {
  classes: ClassesType,
  post: PostsListWithVotes
}) => {
  const { LWTooltip } = Components
  const interaction = post.currentUserVote || (post.lastVisitedAt ? "readPost" : null)
  if (!interaction) return null

  return <LWTooltip title={interactionLabels[interaction]} placement="left" inlineBlock={false}>
    <div className={classNames(classes.root, classes[interaction])}/>
  </LWTooltip>
}

const PostInteractionStripeComponent = registerComponent('PostInteractionStripe', PostInteractionStripe, {styles});

declare global {
  interface ComponentTypes {
    PostInteractionStripe: typeof PostInteractionStripeComponent
  }
}

