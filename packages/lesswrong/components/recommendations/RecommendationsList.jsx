import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withRecommendations } from './withRecommendations';

class RecommendationsList extends Component {
  render() {
    const { recommendations, recommendationsLoading } = this.props;
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
}

registerComponent('RecommendationsList', RecommendationsList,
  withRecommendations,
  withUser
);

