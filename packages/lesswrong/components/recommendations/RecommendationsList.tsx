import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withRecommendations } from './withRecommendations';

interface ExternalProps {
  algorithm: any,
}
interface RecommendationsListProps extends ExternalProps{
  recommendations: Array<PostsList>|null,
  recommendationsLoading: boolean,
}

const RecommendationsList = ({ recommendations, recommendationsLoading }: RecommendationsListProps) => {
  const { PostsItem2, PostsLoading } = Components;

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>

  return <div>
    {recommendations.map(post =>
      <PostsItem2 post={post} key={post._id}/>)}
    {recommendations.length===0 &&
      <span>There are no more recommendations left.</span>}
  </div>
}

const RecommendationsListComponent = registerComponent<ExternalProps>('RecommendationsList', RecommendationsList, {
  hocs: [withRecommendations]
});

declare global {
  interface ComponentTypes {
    RecommendationsList: typeof RecommendationsListComponent
  }
}

