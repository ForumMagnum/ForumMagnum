import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { isLWorAF } from "../../lib/instanceSettings";
import classNames from "classnames";
import DeferRender from "../common/DeferRender";
import CommentsNode from "../comments/CommentsNode";
import ReviewQuickTakeItem from "./ReviewQuickTakeItem";
import Loading from "../vulcan-core/Loading";
import { ReviewYear } from "../../lib/reviewUtils";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";

const FrontpageReviewsQuery = gql(`
  query FrontpageReviewsQuickTakesQuery($reviewYear: Int!, $limit: Int) {
    ReviewsByPostLastCommentedAt(reviewYear: $reviewYear, limit: $limit) {
      results {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

const styles = defineStyles("FrontpageReviewsQuickTakesList", (theme: ThemeType) => ({
  list: {
    display: "flex",
    flexDirection: "column",
  },
  expandedRoot: {
    position: "relative",
    "& .comments-node-root": {
      marginBottom: 8,
      ...(isLWorAF() ? {
        paddingTop: 0,
        position: 'relative',
      } : {}),
    },
  },
  hidden: {
    display: 'none',
  },
}));

const ReviewListItem = ({ review }: { review: CommentsListWithParentMetadata }) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const [expanded, setExpanded] = useState(false);
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "reviewItemExpanded" : "reviewItemCollapsed");
  }, [captureEvent, setExpanded]);

  const expandedComment = (
    <DeferRender ssr={false}>
      <div className={classNames(classes.expandedRoot, { [classes.hidden]: !expanded })}>
        <CommentsNode
          treeOptions={{
            post: review.post ?? undefined,
            showCollapseButtons: true,
            onToggleCollapsed: () => wrappedSetExpanded(!expanded),
            showPostTitle: true,
          }}
          comment={review}
          loadChildrenSeparately
          forceUnTruncated
          forceUnCollapsed
        />
      </div>
    </DeferRender>
  );

  const collapsedComment = (
    <div className={classNames({ [classes.hidden]: expanded })}>
      <ReviewQuickTakeItem review={review} setExpanded={wrappedSetExpanded} />
    </div>
  );

  return <>
    {expandedComment}
    {collapsedComment}
  </>;
};

const FrontpageReviewsQuickTakesList = ({ reviewYear }: { reviewYear: ReviewYear }) => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(FrontpageReviewsQuery, {
    variables: {
      reviewYear,
      limit: 3,
    },
  });

  const results = data?.ReviewsByPostLastCommentedAt?.results;

  if (loading) {
    return <Loading />;
  }

  if (!results?.length) {
    return null;
  }

  return (
    <div className={classes.list}>
      {results.map((review) => (
        <ReviewListItem key={review._id} review={review} />
      ))}
    </div>
  );
};

export default registerComponent("FrontpageReviewsQuickTakesList", FrontpageReviewsQuickTakesList);
