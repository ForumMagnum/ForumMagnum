import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
});

const PopularCommentsList = ({classes}: {classes: ClassesType}) => {
  const {loadMoreProps, results} = usePaginatedResolver({
    fragmentName: "CommentsListWithParentMetadata",
    resolverName: "PopularComments",
    limit: 3,
    itemsPerPage: 5,
  });

  const {LoadMore, PopularComment} = Components;
  return (
    <AnalyticsContext pageSectionContext="popularCommentsList">
      <div className={classes.root}>
        {results?.map((comment) =>
          <PopularComment
            key={comment._id}
            comment={comment}
          />
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </AnalyticsContext>
  );
}

const PopularCommentsListComponent = registerComponent(
  "PopularCommentsList",
  PopularCommentsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularCommentsList: typeof PopularCommentsListComponent
  }
}
