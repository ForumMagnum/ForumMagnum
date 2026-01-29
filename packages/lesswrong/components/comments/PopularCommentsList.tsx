import React from "react";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import LoadMore from "../common/LoadMore";
import FriendlyPopularComment from "./FriendlyPopularComment";
import LWPopularComment from "./LWPopularComment";
import { useQueryWithLoadMore } from "../hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("PopularCommentsList", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.isFriendlyUI ? 14 : '1.16rem',
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
}));

const PopularCommentsList = () => {
  const classes = useStyles(styles);
  const initialLimit = 3;
  const { data, loadMoreProps } = useQueryWithLoadMore(gql(`
    query PopularComments($limit: Int) {
      PopularComments(limit: $limit) {
        results {
          ...CommentsListWithParentMetadata
        }
      }
    }
  `), {
    variables: { limit: initialLimit },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    itemsPerPage: 5,
  });

  const results = data?.PopularComments?.results;

  const CommentComponent = isFriendlyUI() ? FriendlyPopularComment : LWPopularComment;
  return (
    <AnalyticsContext pageSectionContext="popularCommentsList">
      <div className={classes.root}>
        {results?.map((comment) =>
          <CommentComponent
            key={comment._id}
            comment={comment}
          />
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </AnalyticsContext>
  );
}

export default PopularCommentsList;


