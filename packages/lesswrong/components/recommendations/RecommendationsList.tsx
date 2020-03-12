import React from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { withRecommendations } from './withRecommendations';

interface ExternalProps {
  showLoginPrompt?: boolean,
  algorithm: any,
}
interface RecommendationsListProps extends ExternalProps{
  recommendations: Array<PostsList>|null,
  recommendationsLoading: boolean,
}

const RecommendationsList = ({ recommendations, recommendationsLoading, showLoginPrompt=true }: RecommendationsListProps) => {
  const currentUser = useCurrentUser();
  const { PostsItem2, PostsLoading, SectionFooter, LoginPopupButton } = Components;
  
  const nameWithArticle = getSetting<string>('siteNameWithArticle')
  const capitalizedName = nameWithArticle.charAt(0).toUpperCase() + nameWithArticle.slice(1)

  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>
  
  const improvedRecommendationsTooltip = <div>
    {capitalizedName} keeps track of what recommended posts logged-in users have read. Login to get recommended posts you haven't read before.
  </div>

  return <div>
    {recommendations.map(post =>
      <PostsItem2 post={post} key={post._id}/>)}
    {recommendations.length===0 &&
      <span>There are no more recommendations left.</span>}
    {!currentUser && showLoginPrompt && <SectionFooter>
      <LoginPopupButton title={improvedRecommendationsTooltip}>
        Log in for improved recommendations
      </LoginPopupButton>
    </SectionFooter>}
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

