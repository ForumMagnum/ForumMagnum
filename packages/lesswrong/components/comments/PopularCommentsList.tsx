import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { unflattenComments } from "@/lib/utils/unflatten";

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

const PopularCommentsList = ({classes}: {classes: ClassesType}) => {
  const {loadMoreProps, results} = usePaginatedResolver({
    fragmentName: "CommentsListWithParentMetadata",
    resolverName: "PopularDiscussion",
    limit: 6,
    itemsPerPage: 5,
  });
  const commentTree = unflattenComments(results ?? []);
  const {LoadMore, FriendlyPopularComment, LWPopularComment, CommentsList} = Components;

  const CommentComponent = isFriendlyUI ? FriendlyPopularComment : LWPopularComment;
  return (
    <AnalyticsContext pageSectionContext="popularCommentsList">
      <div className={classes.root}>
      <CommentsList
        treeOptions={{
          showCollapseButtons: true
        }}
        comments={commentTree}
        startThreadTruncated={true}
        loading={loadMoreProps.loading}
      />
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
