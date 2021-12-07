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
    alignItems: "center"
  },
  lastReview: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontStyle: "italic"
  }
})

const LatestReview = ({classes}) => {
  const { PostsPreviewTooltipSingleWithComment, LWTooltip, FormatDate, ErrorBoundary } = Components

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
      <Link to={postGetPageUrl(comment.post)} className={classes.lastReview}>Latest Review: {comment.post.title} <FormatDate date={comment.postedAt}/></Link>
    </LWTooltip>
  </div></ErrorBoundary>
}


const LatestReviewComponent = registerComponent('LatestReview', LatestReview, {styles});

declare global {
  interface ComponentTypes {
    LatestReview: typeof LatestReviewComponent
  }
}
