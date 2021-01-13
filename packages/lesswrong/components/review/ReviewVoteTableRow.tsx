import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { vote, quadraticVote } from './ReviewVotingPage';

const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit*1.5,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    position: "relative",
    '&:hover': {
      '& $expand': {
        display: "block"
      }
    }
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
    maxWidth: "calc(100% - 100px)"
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
    background: "#eee"
  }
});

const ReviewVoteTableRow = (
  { post, dispatch, dispatchQuadraticVote, useQuadratic, classes, expandedPostId, currentQualitativeVote, currentQuadraticVote }: {
    post: PostsList,
    dispatch: React.Dispatch<vote>,
    dispatchQuadraticVote: any,
    useQuadratic: boolean,
    classes:ClassesType,
    expandedPostId: string,
    currentQualitativeVote: vote|null,
    currentQuadraticVote: quadraticVote|null,
  }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip, MetaInfo, QuadraticVotingButtons, ReviewVotingButtons } = Components

  const currentUser = useCurrentUser()
  if (!currentUser) return null;

  const currentUserIsAuthor = post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id)

  return <AnalyticsContext pageElementContext="voteTableRow">
    <div className={classNames(classes.root, {[classes.expanded]: expandedPostId === post._id})}>
      <div>
        <div className={classes.postVote} >
          <div className={classes.post}>
            <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
              <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
            </LWTooltip>
          </div>
          {!currentUserIsAuthor && <div>
              {useQuadratic ?
                <QuadraticVotingButtons postId={post._id} voteForCurrentPost={currentQuadraticVote} vote={dispatchQuadraticVote} /> :
                <ReviewVotingButtons postId={post._id} dispatch={dispatch} voteForCurrentPost={currentQualitativeVote} />
              }
          </div>}
          {currentUserIsAuthor && <MetaInfo>You cannot vote on your own posts</MetaInfo>}
        </div>
      </div>
    </div>
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
