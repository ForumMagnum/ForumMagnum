import React, { ChangeEvent, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { frontpageDaysAgoCutoffSetting } from "../../lib/scoring";
import { useLocation } from "../../lib/routeUtil";
import { useMulti } from "../../lib/crud/withMulti";
import { PostsPageContext } from "../posts/PostsPage/PostsPageContext";
import { useCurrentUser } from "../common/withUser";
import {
  isRecommendationStrategyName,
  RecommendationFeatureName,
  recommendationFeatureNames,
  RecommendationStrategyName,
  recommendationStrategyNames,
  WeightedFeature,
} from "../../lib/collections/users/recommendationSettings";
import Checkbox from "@material-ui/core/Checkbox";
import Select from "@material-ui/core/Select";
import Input from "@material-ui/core/Input";
import moment from "moment";
import qs from "qs";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useCurrentTime } from "../../lib/utils/timeUtil";

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

const parseStrategy = (queryStrategy?: string): RecommendationStrategyName =>
  queryStrategy && isRecommendationStrategyName(queryStrategy)
    ? queryStrategy
    : "tagWeightedCollabFilter";

const parseNumber = (queryValue?: string, defaultValue = 1): number => {
  if (queryValue) {
    const parsed = parseFloat(queryValue);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
}

const getDefaultFeatures = (): Record<RecommendationFeatureName, string> => ({
  karma: "0.8",
  curated: "0.1",
  tagSimilarity: "1.5",
  collabFilter: "1",
  textSimilarity: "1",
});

const featureInputToFeatures = (
  input: Record<RecommendationFeatureName, string>,
): WeightedFeature[] => {
  const result: WeightedFeature[] = [];
  for (const feature_ in input) {
    const feature = feature_ as RecommendationFeatureName;
    result.push({feature, weight: parseNumber(input[feature])});
  }
  return result;
}

const RecommendationsSamplePage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
  const {query} = useLocation();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<RecommendationStrategyName>(
    parseStrategy(query.strategy),
  );
  const [loggedOutView, setLoggedOutView] = useState(
    query.loggedOutView ? query.loggedOutView === "true" : true,
  );
  const [bias, setBias] = useState(parseNumber(query.bias, 1.5));
  const [biasInput, setBiasInput] = useState(String(bias));
  const [featureInput, setFeatureInput] = useState(getDefaultFeatures);
  const [features, setFeatures] = useState(
    () => featureInputToFeatures(getDefaultFeatures()),
  );

  const {results, loading, loadMoreProps} = useMulti({
    terms: {
      after: moment(now).subtract(
        frontpageDaysAgoCutoffSetting.get()*24,
        "hours",
      ).startOf("hour").toISOString(),
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
      navigate({
        ...location,
        search: qs.stringify({
          ...query,
          strategy: name,
        }),
      }, {replace: true});
    }
  }

  const onChangeLoggedOutView = (
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setLoggedOutView(checked);
    navigate({
      ...location,
      search: qs.stringify({
        ...query,
        loggedOutView: checked ? "true" : "false",
      }),
    }, {replace: true});
  }

  const onChangeBias = (e: ChangeEvent<HTMLInputElement>) =>
    setBiasInput(e.target?.value ?? "");

  const onBlurBias = () => {
    const value = parseNumber(biasInput);
    setBias(value);
    navigate({
      ...location,
      search: qs.stringify({
        ...query,
        bias: value,
      }),
    }, {replace: true});
  }

  const onChangeFeature = (feature: RecommendationFeatureName) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setFeatureInput({...featureInput, [feature]: e.target?.value ?? ""});

  const onBlurFeature = () => setFeatures(featureInputToFeatures(featureInput));

  const showBias = strategy === "tagWeightedCollabFilter";
  const showFeatures = strategy === "feature";

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
          {showBias &&
            <div>
              <Input
                placeholder={"Bias"}
                value={biasInput}
                onChange={onChangeBias}
                onBlur={onBlurBias}
              />
            </div>
          }
        </div>
        {showFeatures &&
          <div className={classes.settings}>
            {Array.from(recommendationFeatureNames).map((feature) =>
              <div key={feature}>
                {feature}
                <Input
                  placeholder={feature}
                  value={featureInput[feature]}
                  onChange={onChangeFeature(feature)}
                  onBlur={onBlurFeature}
                />
              </div>
            )}
          </div>
        }
        {results?.map((post: PostsListWithVotes) =>
          <div key={post._id} className={classes.result}>
            <PostsItem post={post} />
            <PostsPageContext.Provider value={{fullPost: post as PostsWithNavigationAndRevision, postPreload: null}}>
              <PostsPageRecommendationsList
                title=""
                strategy={strategy}
                bias={bias}
                features={features}
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
