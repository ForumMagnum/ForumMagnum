import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import { useCurrentUser } from "../common/withUser";
import { gql, useMutation } from "@apollo/client";
import type {
  RecommendationsAlgorithmWithStrategy,
  RecommendationStrategyName,
} from "../../lib/collections/users/recommendationSettings";

const clickRecommendationMutation = gql`
  mutation clickRecommendation($postId: String!) {
    clickRecommendation(postId: $postId)
  }
`;

const PostsPageRecommendationsList = ({
  title = "More posts like this",
  strategy = "moreFromTag",
  forceLoggedOutView,
}: {
  title?: string,
  strategy?: RecommendationStrategyName,
  forceLoggedOutView?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const [clickRecommendation] = useMutation(
    clickRecommendationMutation,
    {errorPolicy: "all"},
  );

  const post = usePostsPageContext();
  if (!post) {
    return null;
  }

  const onRecommendationClicked = (postId: string) => {
    if (currentUser) {
      void clickRecommendation({
        variables: {
          postId,
        },
      });
    }
  }

  const recommendationsAlgorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      name: strategy,
      postId: post._id,
      forceLoggedOutView,
    },
    count: 3,
  };

  const {SectionTitle, RecommendationsList, PostsItemIntroSequence} = Components;
  return (
    <div>
      {title && <SectionTitle title={title} />}
      <RecommendationsList
        algorithm={recommendationsAlgorithm}
        ListItem={({post, translucentBackground}: {
          post: PostsListWithVotesAndSequence,
          translucentBackground?: boolean,
        }) =>
          <div onClick={() => onRecommendationClicked(post._id)}>
            <PostsItemIntroSequence
              post={post}
              sequence={post.canonicalSequence ?? undefined}
              withImage={!!post.canonicalSequence?.gridImageId}
              translucentBackground={translucentBackground}
            />
          </div>
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
