import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePostsPageContext } from "../posts/PostsPage/PostsPageContext";
import type { RecommendationsAlgorithmWithStrategy } from "../../lib/collections/users/recommendationSettings";

const PostsPageRecommendationsList = ({
  title = "More posts like this",
}: {
  title?: string,
}) => {
  const post = usePostsPageContext();
  if (!post) {
    return null;
  }

  const recommendationsAlgorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      name: "collabFilter",
      postId: post._id,
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
          <PostsItemIntroSequence
            post={post}
            sequence={post.canonicalSequence ?? undefined}
            withImage={!!post.canonicalSequence?.gridImageId}
            translucentBackground={translucentBackground}
          />
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
