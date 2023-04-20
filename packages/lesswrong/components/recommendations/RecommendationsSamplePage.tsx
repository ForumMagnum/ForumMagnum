import React, { ChangeEvent, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { frontpageDaysAgoCutoffSetting } from "../../lib/scoring";
import { useTimezone } from "../common/withTimezone";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { useMulti } from "../../lib/crud/withMulti";
import { PostsPageContext } from "../posts/PostsPage/PostsPageContext";
import { useCurrentUser } from "../common/withUser";
import {
  isRecommendationStrategyName,
  RecommendationStrategyName,
  recommendationStrategyNames,
} from "../../lib/collections/users/recommendationSettings";
import Checkbox from "@material-ui/core/Checkbox";
import Select from "@material-ui/core/Select";
import moment from "moment";
import qs from "qs";

const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down("sm")]: {
      paddingTop: 30
    }
  },
  settings: {
    display: "flex",
    alignItems: "center",
    gap: "2em",
    marginBottom: 20,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  result: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: 42,
  },
});

const getInitialStrategy = (queryStrategy?: string): RecommendationStrategyName =>
  queryStrategy && isRecommendationStrategyName(queryStrategy)
    ? queryStrategy
    : "moreFromTag";

const RecommendationsSamplePage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {timezone} = useTimezone();
  const {query} = useLocation();
  const {history} = useNavigation();
  const [strategy, setStrategy] = useState<RecommendationStrategyName>(
    getInitialStrategy(query.strategy),
  );
  const [loggedOutView, setLoggedOutView] = useState(
    query.loggedOutView ? query.loggedOutView === "true" : true,
  );

  const {results, loading, loadMoreProps} = useMulti({
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

  if (!currentUser?.isAdmin) {
    return (
      <Components.Error404 />
    );
  }

  const onChangeStrategy = (e: ChangeEvent<HTMLSelectElement>) => {
    const name = e.target?.value;
    if (isRecommendationStrategyName(name)) {
      setStrategy(name);
      history.replace({
        ...location,
        search: qs.stringify({
          ...query,
          strategy: name,
        }),
      });
    }
  }

  const onChangeLoggedOutView = (
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setLoggedOutView(checked);
    history.replace({
      ...location,
      search: qs.stringify({
        ...query,
        loggedOutView: checked ? "true" : "false",
      }),
    });
  }

  const {
    SingleColumnSection, SectionTitle, PostsItem, PostsPageRecommendationsList,
    LoadMore, Loading, MenuItem,
  } = Components;

  return (
    <div className={classes.root}>
      <SingleColumnSection>
        <SectionTitle title="Recommendations Sample"/>
        <div className={classes.settings}>
          <Select
            value={strategy}
            onChange={onChangeStrategy}
          >
            {Array.from(recommendationStrategyNames).map((name) =>
              <MenuItem key={name} value={name}>{name}</MenuItem>
            )}
          </Select>
          <div>
            <Checkbox
              checked={loggedOutView}
              onChange={onChangeLoggedOutView}
            />
            Force logged out view
          </div>
        </div>
        {results?.map((post: PostsListWithVotes) =>
          <div key={post._id} className={classes.result}>
            <PostsItem post={post} />
            <PostsPageContext.Provider value={post as PostsWithNavigationAndRevision}>
              <PostsPageRecommendationsList
                title=""
                strategy={strategy}
                forceLoggedOutView={loggedOutView}
              />
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
