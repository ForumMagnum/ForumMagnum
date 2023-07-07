import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";

const styles = (_theme: ThemeType) => ({
});

const PopularCommentsList = () => {
  const {loading, loadMoreProps, results} = useMulti({
    terms: {view: "frontpagePopular"},
    collectionName: "Comments",
    fragmentName: "CommentsList",
    enableTotal: false,
    limit: 5,
  });

  const {Loading, LoadMore} = Components;
  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      {results?.map((comment) => (
        <div>
          {comment.contents?.html}
        </div>
      ))}
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
