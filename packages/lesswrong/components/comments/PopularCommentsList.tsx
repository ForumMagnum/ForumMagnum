import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";

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
  const {loadMoreProps, results} = useMulti({
    terms: {view: "frontpagePopular"},
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
    enableTotal: false,
    limit: 3,
  });

  const {LoadMore, PopularComment} = Components;
  return (
    <div className={classes.root}>
      {results?.map((comment) =>
        <PopularComment
          key={comment._id}
          comment={comment}
        />
      )}
      <LoadMore {...loadMoreProps} />
    </div>
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
