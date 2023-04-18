import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useRecommendations } from './withRecommendations';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const RecommendationsList = ({algorithm, translucentBackground}: {
  algorithm: RecommendationsAlgorithm,
  translucentBackground?: boolean
}) => {
  const { PostsItem, PostsLoading, Typography } = Components;
  const {recommendationsLoading, recommendations} = useRecommendations(algorithm);

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>

  return <div>
    {recommendations.map(post =>
      <PostsItem post={post} key={post._id} translucentBackground={translucentBackground}/>)}
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
