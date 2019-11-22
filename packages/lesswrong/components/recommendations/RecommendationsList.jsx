import React, { Component } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withRecommendations } from './withRecommendations';
import { captureEvent } from '../../lib/analyticsEvents';

class RecommendationsList extends Component {
  render() {
    const { recommendations, recommendationsLoading, currentUser, showLoginPrompt=true } = this.props;
    const { PostsItem2, PostsLoading, SectionFooter, LoginPopupButton } = Components;
    
    const nameWithArticle = getSetting('siteNameWithArticle')
    const capitalizedName = nameWithArticle.charAt(0).toUpperCase() + nameWithArticle.slice(1)

    if (recommendationsLoading || !recommendations)
      return <PostsLoading/>
    
    const improvedRecommendationsTooltip = <div>
      {capitalizedName} keeps track of what recommended posts logged-in users have read. Login to get recommended posts you haven't read before.
    </div>

    return <div>
      {recommendations.map(post =>
        <PostsItem2 post={post} key={post._id} listContext={"fromTheArchives"} />)}
      {recommendations.length===0 &&
        <span>There are no more recommendations left.</span>}
      {!currentUser && showLoginPrompt && <SectionFooter>
        <LoginPopupButton title={improvedRecommendationsTooltip}>
          Log in for improved recommendations
        </LoginPopupButton>
      </SectionFooter>}
    </div>
  }

  componentDidMount() {
    const { recommendations } = this.props
  }
}

registerComponent('RecommendationsList', RecommendationsList,
  withRecommendations,
  withUser
);
