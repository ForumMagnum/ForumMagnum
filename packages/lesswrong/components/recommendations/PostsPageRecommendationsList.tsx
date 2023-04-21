import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import type {
  RecommendationsAlgorithmWithStrategy,
  RecommendationStrategyName,
} from "../../lib/collections/users/recommendationSettings";

const PostsPageRecommendationsList = ({
  title = "More posts like this",
  strategy = "moreFromTag",
  bias = 1,
  forceLoggedOutView,
}: {
  title?: string,
  strategy?: RecommendationStrategyName,
  bias?: number,
  forceLoggedOutView?: boolean,
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
      forceLoggedOutView,
    },
    count: 3,
  };

  const {SectionTitle, RecommendationsList, PostsPageRecommendationItem} = Components;
  return (
    <div>
      {title && <SectionTitle title={title} />}
      <RecommendationsList
        algorithm={recommendationsAlgorithm}
        ListItem={
          (props: {
            post: PostsListWithVotesAndSequence,
            translucentBackground?: boolean,
          }) => (
            <PostsPageRecommendationItem
              {...props}
              disableAnalytics={forceLoggedOutView}
            />
          )
        }
      />
    </div>
  );
}

const PostsPageRecommendationsListComponent = registerComponent(
  "PostsPageRecommendationsList",
  PostsPageRecommendationsList,
);

declare global {
  interface ComponentTypes {
    PostsPageRecommendationsList: typeof PostsPageRecommendationsListComponent
  }
}
