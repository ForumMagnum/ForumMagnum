import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { LoadMore } from "../common/LoadMore";
import { FriendlyPopularComment } from "./FriendlyPopularComment";
import { LWPopularComment } from "./LWPopularComment";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: isFriendlyUI ? 14 : '1.16rem',
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
});

const PopularCommentsListInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const {loadMoreProps, results} = usePaginatedResolver({
    fragmentName: "CommentsListWithParentMetadata",
    resolverName: "PopularComments",
    limit: 3,
    itemsPerPage: 5,
  });
  const CommentComponent = isFriendlyUI ? FriendlyPopularComment : LWPopularComment;
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

export const PopularCommentsList = registerComponent(
  "PopularCommentsList",
  PopularCommentsListInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularCommentsList: typeof PopularCommentsList
  }
}
