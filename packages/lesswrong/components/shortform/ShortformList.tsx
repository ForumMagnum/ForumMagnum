import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { useCurrentUser } from "../common/withUser";
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

const ShortformList = ({classes}: {classes: ClassesType}) => {
  // const {loadMoreProps, results} = usePaginatedResolver({
  //   fragmentName: "CommentsListWithParentMetadata",
  //   resolverName: "PopularComments",
  //   limit: 3,
  //   itemsPerPage: 5,
  // });

  const maxAgeDays = 30; // pass this in instead
  const currentUser = useCurrentUser();
  const {
    results,
    loading,
    showLoadMore,
    loadMoreProps, 
    refetch
  } = useMulti({
    terms: {
      view: "shortformFrontpage",
      limit: 3,
      maxAgeDays,
    },
    collectionName: "Comments",
    fragmentName: "ShortformComments",
    itemsPerPage: 5,
  });

  const {LoadMore, LWShortform} = Components;

  return (
    <AnalyticsContext pageSectionContext="popularCommentsList">
      <div className={classes.root}>
        {results?.map((comment) =>
          <LWShortform
            key={comment._id}
            comment={comment}
          />
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </AnalyticsContext>
  );
}

const ShortformListComponent = registerComponent(
  "ShortformList",
  ShortformList,
  {styles},
);

declare global {
  interface ComponentTypes {
    ShortformList: typeof ShortformListComponent
  }
}
