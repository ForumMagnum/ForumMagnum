import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { withRecommendations } from './withRecommendations';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';

interface ExternalProps {
  showLoginPrompt?: boolean,
  algorithm: any,
}
interface RecommendationsListProps extends ExternalProps{
  recommendations: Array<PostsList>|null,
  recommendationsLoading: boolean,
}

const RecommendationsList = ({ recommendations, recommendationsLoading, showLoginPrompt=true }: RecommendationsListProps) => {
  const { PostsItem2, PostsLoading } = Components;
  
  const nameWithArticle = siteNameWithArticleSetting.get()
  const capitalizedName = nameWithArticle.charAt(0).toUpperCase() + nameWithArticle.slice(1)

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

