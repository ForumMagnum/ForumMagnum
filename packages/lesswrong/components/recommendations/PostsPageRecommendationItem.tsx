import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { gql, useMutation } from "@apollo/client";

const clickRecommendationMutation = gql`
  mutation clickRecommendation($postId: String!) {
    clickRecommendation(postId: $postId)
  }
`;

const PostsPageRecommendationItem = ({post, translucentBackground}: {
  post: PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const [clickRecommendation] = useMutation(
    clickRecommendationMutation,
    {errorPolicy: "all"},
  );

  const onRecommendationClicked = (postId: string) => {
    if (currentUser) {
      void clickRecommendation({
        variables: {
          postId,
        },
      });
    }
  }

  const {PostsItemIntroSequence} = Components;
  return (
    <div onClick={() => onRecommendationClicked(post._id)}>
      <PostsItemIntroSequence
        post={post}
        sequence={post.canonicalSequence ?? undefined}
        withImage={!!post.canonicalSequence?.gridImageId}
        translucentBackground={translucentBackground}
      />
    </div>
  );
}

const PostsPageRecommendationItemComponent = registerComponent(
  "PostsPageRecommendationItem",
  PostsPageRecommendationItem,
);

declare global {
  interface ComponentTypes {
    PostsPageRecommendationItem: typeof PostsPageRecommendationItemComponent
  }
}
