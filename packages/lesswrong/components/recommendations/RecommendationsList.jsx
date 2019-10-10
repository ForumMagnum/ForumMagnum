import React, { Component } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withRecommendations } from './withRecommendations';

class RecommendationsList extends Component {
  render() {
    const { recommendations, recommendationsLoading, currentUser } = this.props;
    const { PostsItem2, PostsLoading, SectionFooter, LoginPopupButton } = Components;
    if (recommendationsLoading || !recommendations)
      return <PostsLoading/>
    
    const improvedRecommendationsTooltip = <div>
      {getSetting('forumType', 'LessWrong') !== 'LessWrong' && 'The '}{getSetting('title')} keeps track of what recommended posts logged-in users have read. Login to get recommended posts you haven't read before.
    </div>

    return <div>
      {recommendations.map(post =>
        <PostsItem2 post={post} key={post._id}/>)}
      {recommendations.length===0 &&
        <span>There are no more recommendations left.</span>}
      {!currentUser && <SectionFooter>
        <LoginPopupButton title={improvedRecommendationsTooltip}>
          Log in for improved recommendations
        </LoginPopupButton>
      </SectionFooter>}
    </div>
  }
}

registerComponent('RecommendationsList', RecommendationsList,
  withRecommendations,
  withUser
);

