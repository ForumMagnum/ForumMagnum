import React, { ComponentType } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useRecommendations } from './withRecommendations';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

export type RecommendationsListItem = ComponentType<{
  post: PostsListWithVotes|PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}>;

const RecommendationsList = ({
  algorithm,
  translucentBackground,
  ListItem = Components.PostsItem,
}: {
  algorithm: RecommendationsAlgorithm,
  translucentBackground?: boolean,
  ListItem?: RecommendationsListItem,
}) => {
  const {PostsLoading, Typography} = Components;
  const {recommendationsLoading, recommendations} = useRecommendations(algorithm);

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>

  return <div>
    {recommendations.map(post =>
      <ListItem
        key={post._id}
        post={post}
        translucentBackground={translucentBackground}
      />
    )}
    {recommendations.length===0 &&
      <Typography variant="body1"><small>There are no more recommendations left.</small></Typography>}
  </div>
}

const RecommendationsListComponent = registerComponent('RecommendationsList', RecommendationsList);

declare global {
  interface ComponentTypes {
    RecommendationsList: typeof RecommendationsListComponent
  }
}
