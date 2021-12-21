import React from 'react';
import { useMulti } from "../../lib/crud/withMulti";
import { REVIEW_YEAR } from "../../lib/reviewUtils";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { useHover } from '../common/withHover';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const styles = theme => ({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "left",
    overflow: "hidden",
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  lastReview: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600]
  },
  title: {
    color: theme.palette.primary.main
  }
})

const LatestReview = ({classes}) => {
  const { PostsPreviewTooltip, LWPopper, ErrorBoundary, CommentsNode } = Components

  const { results: commentResults } = useMulti({
    terms:{ view: "reviews", reviewYear: REVIEW_YEAR, sortBy: "new"},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    limit: 1
  });

  const { hover, anchorEl, eventHandlers } = useHover({
    pageElementContext: "frontpageReviewWidget",
    pageElementSubContext: "latestReviews",
  })

  if (!commentResults?.length) return null
  const comment = commentResults[0]
  if (!comment.post) return null

  return <ErrorBoundary><AnalyticsContext pageSubsectionContext="latestReview">
    <div className={classes.root} {...eventHandlers} >
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
      >
        <span className={classes.preview}>{<PostsPreviewTooltip post={comment.post} comment={comment}/>}</span>
      </LWPopper>
      <CommentsNode
          treeOptions={{
            post: comment.post, hideSingleLineMeta: true, enableHoverPreview: false
          }}
          comment={comment}
          key={comment._id}
          forceSingleLine loadChildrenSeparately
        />
      {/* <Link to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: comment.post.slug})} className={classes.lastReview}>Latest Review: <span className={classes.title}>{comment.post.title}</span></Link> */}
    </div>
  </AnalyticsContext></ErrorBoundary>
}


const LatestReviewComponent = registerComponent('LatestReview', LatestReview, {styles});

declare global {
  interface ComponentTypes {
    LatestReview: typeof LatestReviewComponent
  }
}
