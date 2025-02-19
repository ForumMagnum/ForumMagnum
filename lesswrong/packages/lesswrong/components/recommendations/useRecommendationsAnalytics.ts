import { MouseEvent, useCallback } from "react";
import { useObserver } from "../hooks/useObserver";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";

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

export const useRecommendationAnalytics = <
  T extends HTMLElement = HTMLDivElement,
  U extends HTMLElement = HTMLDivElement,
>(
  postId: string,
  onClickHandler?: (e: MouseEvent) => void,
  disableAnalytics = false,
) => {
  const [observeRecommendation] = useMutation(
    observeRecommendationMutation,
    {errorPolicy: "all"},
  );
  const [clickRecommendation] = useMutation(
    clickRecommendationMutation,
    {errorPolicy: "all"},
  );

  const onObserve = useCallback(() => {
    if (!disableAnalytics) {
      void observeRecommendation({
        variables: {
          postId: postId,
        },
      });
    }
  }, [postId, observeRecommendation, disableAnalytics]);

  const ref = useObserver<T>({
    onEnter: onObserve,
    maxTriggers: 1,
  });

  const onClick = useCallback((e: MouseEvent<U>) => {
    if (!disableAnalytics) {
      void clickRecommendation({
        variables: {
          postId: postId,
        },
      });
    }
    onClickHandler?.(e);
  }, [postId, clickRecommendation, disableAnalytics, onClickHandler]);

  return {
    ref,
    onClick,
  };
}
