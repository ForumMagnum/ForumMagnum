import React from 'react';
import { REVIEW_YEAR } from "../../lib/reviewUtils";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import ErrorBoundary from "../common/ErrorBoundary";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentLatestReviewQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "left",
    overflow: "hidden",
    padding: 6,
    whiteSpace: "nowrap",
    marginRight: 15,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  lastReview: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    position: "relative",
    top: -2
  },
  title: {
    color: theme.palette.primary.main,
    display: "block"
  }
})

const LatestReview = ({classes}: { classes: ClassesType<typeof styles> }) => {
  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { reviews: { reviewYear: REVIEW_YEAR, sortBy: "new" } },
      limit: 1,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const commentResults = data?.comments?.results;

  if (!commentResults?.length) return null
  const comment = commentResults[0]
  if (!comment.post || !comment.postId) return null

  const href = commentGetPageUrlFromIds({
    postId: comment.postId,
    commentId: comment._id,
    postSlug: comment.post.slug,
  });
  return (
    <ErrorBoundary>
      <AnalyticsContext pageSubsectionContext="latestReview">
        <PostsTooltip
          postId={comment.postId}
          commentId={comment._id}
          placement="bottom-start"
          clickable
          pageElementContext="frontpageReviewWidget"
          pageElementSubContext="latestReviews"
        >
          <div className={classes.root}>
            <Link to={href} className={classes.lastReview}>
              Latest Review: <span className={classes.title}>
                {comment.post.title}
              </span>
            </Link>
          </div>
        </PostsTooltip>
      </AnalyticsContext>
    </ErrorBoundary>
  );
}

export default registerComponent('LatestReview', LatestReview, {styles});


