import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { gql, useMutation } from "@apollo/client";
import { useObserver } from "../hooks/useObserver";

const observeRecommendationMutation = gql`
  mutation observeRecommendation($postId: String!) {
    observeRecommendation(postId: $postId)
  }
`;

const clickRecommendationMutation = gql`
  mutation clickRecommendation($postId: String!) {
    clickRecommendation(postId: $postId)
  }
`;

const PostsPageRecommendationItem = ({
  post,
  translucentBackground,
  disableAnalytics,
}: {
  post: PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
  disableAnalytics?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const [observeRecommendation] = useMutation(
    observeRecommendationMutation,
    {errorPolicy: "all"},
  );
  const [clickRecommendation] = useMutation(
    clickRecommendationMutation,
    {errorPolicy: "all"},
  );

  const onObserve = useCallback(() => {
    if (currentUser && !disableAnalytics) {
      void observeRecommendation({
        variables: {
          postId: post._id,
        },
      });
    }
  }, [currentUser, post._id, observeRecommendation]);

  const ref = useObserver<HTMLDivElement>({
    onEnter: onObserve,
    maxTriggers: 1,
  });

  const onClicked = useCallback(() => {
    if (currentUser && !disableAnalytics) {
      void clickRecommendation({
        variables: {
          postId: post._id,
        },
      });
    }
  }, [currentUser, post._id, clickRecommendation]);

  const {PostsItemIntroSequence} = Components;
  return (
    <div onClick={onClicked} ref={ref}>
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
