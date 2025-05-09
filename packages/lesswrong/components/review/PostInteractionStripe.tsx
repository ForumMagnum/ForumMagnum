import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { LWTooltip } from "../common/LWTooltip";

const readPostStyle = (theme: ThemeType) => ({
  background: theme.palette.grey[405],
})

const styles = (theme: ThemeType) => ({
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
  readPost: readPostStyle(theme),
  neutral: readPostStyle(theme),
});

const votePrefix = `You previously gave this post `
const voteSuffix = <div><em>(This is different from a LessWrong Review vote)</em></div>

const readPostLabel = `You have read this post`

const interactionLabels = {
  'bigDownvote': <div>{votePrefix}a strong (karma) downvote{voteSuffix}</div>,
  'smallDownvote': <div>{votePrefix}a (karma) downvote{voteSuffix}</div>,
  'smallUpvote': <div>{votePrefix}a (karma) upvote{voteSuffix}</div>,
  'bigUpvote': <div>{votePrefix}a strong (karma) upvote{voteSuffix}</div>,
  'readPost': readPostLabel,
  'neutral': readPostLabel
}

const isInteractionKey = (value: string | null): value is keyof typeof interactionLabels => 
  !!value && value in interactionLabels;

export const PostInteractionStripeInner = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsListWithVotes
}) => {
  const interaction = post.currentUserVote || (post.lastVisitedAt ? 'readPost' : null)

  if (!isInteractionKey(interaction)) return null

  return <LWTooltip title={interactionLabels[interaction]} placement="left" inlineBlock={false}>
    <div className={classNames(classes.root, classes[interaction])}/>
  </LWTooltip>
}

export const PostInteractionStripe = registerComponent('PostInteractionStripe', PostInteractionStripeInner, {styles});



