import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { ReviewVote, quadraticVote } from './ReviewVotingPage';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    position: "relative",
    '&:hover': {
      '& $expand': {
        display: "block"
      }
    },
  },
  voteIcon: {
    padding: 0
  },
  postVote: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  post: {
    paddingRight: theme.spacing.unit*2,
    maxWidth: "calc(100% - 240px)"
  },
  expand: {
    display:"none",
    position: "absolute",
    bottom: 2,
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[400],
    paddingBottom: 35
  },
  expanded: {
    backgroundColor: "#f0f0f0",
  },
  topRow: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 10
  },
  highlight: {
    padding: 16,
    background: "#f9f9f9",
    borderTop: "solid 1px rgba(0,0,0,.1)"
  },
  userVote: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: 6,
    background: "#bbb"
  },
  expandIcon: {
    color: theme.palette.grey[500],
    width: 36,
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

const ReviewVoteTableRow = (
  { post, dispatch, /* dispatchQuadraticVote, */ useQuadratic, classes, expandedPostId, currentQualitativeVote, currentQuadraticVote, showKarmaVotes }: {
    post: PostsListWithVotes,
    dispatch: React.Dispatch<ReviewVote>,
    // dispatchQuadraticVote: any,
    showKarmaVotes: boolean,
    useQuadratic: boolean,
    classes:ClassesType,
    expandedPostId?: string|null,
    currentQualitativeVote: ReviewVote|null,
    currentQuadraticVote: quadraticVote|null,
  }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip, MetaInfo, QuadraticVotingButtons, ReviewVotingButtons, ErrorBoundary} = Components

  const currentUser = useCurrentUser()
  if (!currentUser) return null;
  const expanded = expandedPostId === post._id

  const currentUserIsAuthor = post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id)

  const voteMap = {
    'bigDownvote': 'a strong downvote',
    'smallDownvote': 'a downvote',
    'smallUpvote': 'an upvote',
    'bigUpvote': 'a strong upvote'
  }

  return <AnalyticsContext pageElementContext="voteTableRow">
    <ErrorBoundary>
      <div className={classNames(classes.root, {[classes.expanded]: expanded})}>
        {showKarmaVotes && post.currentUserVote && <LWTooltip title={`You gave this post ${voteMap[post.currentUserVote]}`} placement="left" inlineBlock={false}>
            <div className={classNames(classes.userVote, classes[post.currentUserVote])}/>
          </LWTooltip>}
        <div className={classes.topRow}>
          <div className={classes.postVote}>
            <div className={classes.post}>
              <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
                <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
              </LWTooltip>
            </div>
            {!currentUserIsAuthor && <div>
                {/* {useQuadratic ? */}
                  {/* <QuadraticVotingButtons postId={post._id} voteForCurrentPost={currentQuadraticVote} vote={dispatchQuadraticVote} /> : */}
                  <ReviewVotingButtons postId={post._id} dispatch={dispatch} voteForCurrentPost={currentQualitativeVote} />
                {/* } */}
            </div>}
            {currentUserIsAuthor && <MetaInfo>You cannot vote on your own posts</MetaInfo>}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  </AnalyticsContext>
}

const ReviewVoteTableRowComponent = registerComponent("ReviewVoteTableRow", ReviewVoteTableRow, {
  styles,
  //areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    ReviewVoteTableRow: typeof ReviewVoteTableRowComponent
  }
}
