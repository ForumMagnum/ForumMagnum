import React from 'react';
import { useMulti } from "../../lib/crud/withMulti";
import { REVIEW_YEAR } from "../../lib/reviewUtils";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const styles = theme => ({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "left",
    height: 28,
    display: "flex",
    alignItems: "center",
    paddingLeft: 6
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
  const { PostsPreviewTooltipSingleWithComment, LWTooltip, ErrorBoundary } = Components

  const { results: commentResults } = useMulti({
    terms:{ view: "reviews", reviewYear: REVIEW_YEAR, sortBy: "new"},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    limit: 1
  });

  if (!commentResults?.length) return null
  const comment = commentResults[0]
  if (!comment.post) return null

  return <ErrorBoundary><div className={classes.root}>
    <LWTooltip tooltip={false} title={<PostsPreviewTooltipSingleWithComment postId={comment.postId} commentId={comment._id}/>}>
      <Link to={postGetPageUrl(comment.post)} className={classes.lastReview}>Latest Review: <span className={classes.title}>{comment.post.title}</span></Link>
    </LWTooltip>
  </div></ErrorBoundary>
}


const LatestReviewComponent = registerComponent('LatestReview', LatestReview, {styles});

declare global {
  interface ComponentTypes {
    LatestReview: typeof LatestReviewComponent
  }
}
