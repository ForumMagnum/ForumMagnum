import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import LoadMore from "@/components/common/LoadMore";
import FriendlyPopularComment from "@/components/comments/FriendlyPopularComment";
import LWPopularComment from "@/components/comments/LWPopularComment";

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

const PopularCommentsList = ({classes}: {classes: ClassesType<typeof styles>}) => {
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

export default PopularCommentsListComponent;
