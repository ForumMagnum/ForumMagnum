import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useRecommendations } from './withRecommendations';
import { Typography } from '@material-ui/core'
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const RecommendationsList = ({algorithm}: {
  algorithm: RecommendationsAlgorithm,
}) => {
  const { PostsItem2, PostsLoading } = Components;
  const {recommendationsLoading, recommendations} = useRecommendations(algorithm);

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>

  return <div>
    {recommendations.map(post =>
      <PostsItem2 post={post} key={post._id}/>)}
    {recommendations.length===0 &&
      <Typography><small>There are no more recommendations left.</small></Typography>}
  </div>
}

const RecommendationsListComponent = registerComponent('RecommendationsList', RecommendationsList);

declare global {
  interface ComponentTypes {
    RecommendationsList: typeof RecommendationsListComponent
  }
}
