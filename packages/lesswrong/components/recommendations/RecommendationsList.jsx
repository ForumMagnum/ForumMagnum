import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { getFragment } from 'meteor/vulcan:core';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import withUser from '../common/withUser';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings.js';

const withRecommendations = component => {
  const recommendationsQuery = gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        posts {
          ...PostsList
        }
        resumeReading {
          sequence {
            _id
            title
          }
          lastReadPost {
            ...PostsList
          }
          nextPost {
            ...PostsList
          }
        }
      }
    }
    ${getFragment("PostsList")}
  `;

  return graphql(recommendationsQuery,
    {
      alias: "withRecommendations",
      options: (props) => ({
        variables: {
          count: props.algorithm?.count || 10,
          algorithm: props.algorithm || defaultAlgorithmSettings,
        }
      }),
      props(props) {
        return {
          recommendationsLoading: props.data.loading,
          recommendations: props.data.Recommendations,
        }
      }
    }
  )(component);
}

const RecommendationsList = ({ recommendations, recommendationsLoading, currentUser }) => {
  const { PostsItem2, ResumeReadingItem, PostsLoading } = Components;
  if (recommendationsLoading || !recommendations)
    return <PostsLoading/>
  
  return <div>
    {recommendations.resumeReading.map(resumeReading =>
      <ResumeReadingItem sequence={resumeReading.sequence} lastReadPost={resumeReading.lastReadPost} nextPost={resumeReading.nextPost} key={resumeReading.sequence._id} currentUser={currentUser}/>)}
    {recommendations.posts.map(post =>
      <PostsItem2 post={post} key={post._id} currentUser={currentUser}/>)}
    {recommendations.posts.length===0 && recommendations.resumeReading.length==0 &&
      <span>There are no more recommendations left.</span>}
  </div>
}

registerComponent('RecommendationsList', RecommendationsList,
  withRecommendations,
  withUser
);

