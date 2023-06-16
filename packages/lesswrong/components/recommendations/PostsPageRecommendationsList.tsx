import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import type {
  RecommendationsAlgorithmWithStrategy,
  RecommendationStrategyName,
  WeightedFeature,
} from "../../lib/collections/users/recommendationSettings";
import { CENTRAL_COLUMN_WIDTH, MAX_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";
import NoSSR from "react-no-ssr";

const PADDING = (MAX_COLUMN_WIDTH - CENTRAL_COLUMN_WIDTH) / 4;
const COUNT = 3;

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[55],
    borderRadius: theme.borderRadius.default,
    padding: `0 ${PADDING}px 16px ${PADDING}px`,
    maxWidth: "100%",
  },
  title: {
    paddingTop: 20,
    paddingLeft: PADDING,
  },
  item: {
    // We don't pad right here in order to not over-pad the triple-dot menu
    paddingLeft: PADDING,
  },
  listWrapper: {
    // Approx height of 3 posts, to avoid layout shift
    minHeight: 42 * COUNT,
    [theme.breakpoints.down("sm")]: {
      // We can't know the actual height on small screens due to wrapping, so hedge and
      // make it a bit taller
      minHeight: 60 * COUNT,
    },
  }
});

const PostsPageRecommendationsList = ({
  title = "More posts like this",
  strategy = "moreFromTag",
  bias,
  features,
  forceLoggedOutView,
  classes,
}: {
  title?: string,
  strategy?: RecommendationStrategyName,
  bias?: number,
  features?: WeightedFeature[],
  forceLoggedOutView?: boolean,
  classes: ClassesType,
}) => {
  const post = usePostsPageContext();
  if (!post) {
    return null;
  }

  const recommendationsAlgorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      name: strategy,
      postId: post._id,
      bias,
      features,
      forceLoggedOutView,
    },
    count: COUNT,
  };

  const {SectionTitle, RecommendationsList, PostsPageRecommendationItem, PostsLoading} = Components;

  const loadingFallback = (
    <div className={classes.listWrapper}>
      <PostsLoading />
    </div>
  );

  return (
    <div className={classes.root}>
      {title && <SectionTitle title={title} className={classes.title} />}
      <NoSSR onSSR={loadingFallback}>
        <RecommendationsList
          algorithm={recommendationsAlgorithm}
          loadingFallback={loadingFallback}
          ListItem={
            (props: {
              post: PostsListWithVotesAndSequence,
              translucentBackground?: boolean,
            }) => (
              <PostsPageRecommendationItem
                {...props}
                translucentBackground
                className={classes.item}
                disableAnalytics={forceLoggedOutView}
              />
            )
          }
        />
      </NoSSR>
    </div>
  );
}

const PostsPageRecommendationsListComponent = registerComponent(
  "PostsPageRecommendationsList",
  PostsPageRecommendationsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsPageRecommendationsList: typeof PostsPageRecommendationsListComponent
  }
}
