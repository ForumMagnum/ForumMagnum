import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { frontpageDaysAgoCutoffSetting } from "../../lib/scoring";
import moment from "moment";
import { useTimezone } from "../common/withTimezone";
import { useMulti } from "../../lib/crud/withMulti";
import { PostsPageContext } from "../posts/PostsPage/PostsPageContext";

const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down("sm")]: {
      paddingTop: 30
    }
  },
  result: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: 42,
  },
});

const RecommendationsSamplePage = ({classes}: {
  classes: ClassesType,
}) => {
  const {timezone} = useTimezone();

  const {results, loading, error, loadMoreProps} = useMulti({
    terms: {
      after: moment().tz(timezone).subtract(
        frontpageDaysAgoCutoffSetting.get(),
        "days",
      ).format("YYYY-MM-DD"),
      view: "magic",
      forum: true,
      limit: 20,
    },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    itemsPerPage: 25,
  });

  const {
    SingleColumnSection, SectionTitle, PostsItem, PostsPageRecommendationsList,
    LoadMore, Loading,
  } = Components;

  return (
    <div className={classes.root}>
      <SingleColumnSection>
        <SectionTitle title="Recommendations Sample"/>
        {results?.map((post: PostsListWithVotes) =>
          <div key={post._id} className={classes.result}>
            <PostsItem post={post} />
            <PostsPageContext.Provider value={post as PostsWithNavigationAndRevision}>
              <PostsPageRecommendationsList title="" />
            </PostsPageContext.Provider>
          </div>
        )}
        {loading
          ? <Loading />
          : <LoadMore {...loadMoreProps} />
        }
      </SingleColumnSection>
    </div>
  );
}

const RecommendationsSamplePageComponent = registerComponent(
  "RecommendationsSamplePage",
  RecommendationsSamplePage,
  {styles},
);

declare global {
  interface ComponentTypes {
    RecommendationsSamplePage: typeof RecommendationsSamplePageComponent,
  }
}
