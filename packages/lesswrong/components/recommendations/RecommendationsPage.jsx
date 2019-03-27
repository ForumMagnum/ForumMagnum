import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { getFragment } from 'meteor/vulcan:core';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import withUser from '../common/withUser';

const withRecommendations = component => {
  const recommendationsQuery = gql`
    query RecommendationsQuery($count: Int) {
      Recommendations(count: $count) {
        ...PostsList
      }
    }
    ${getFragment("PostsList")}
  `;

  return graphql(recommendationsQuery,
    {
      alias: "withRecommendations",
      options: () => ({
        variables: {
          count: 10,
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

const styles = theme => ({
});

const RecommendationsPage = ({ classes, recommendations, currentUser }) => {
  const { Section } = Components;
  
  if (!recommendations)
    return <Components.PostsLoading/>
  
  return <Section title="Recommended Posts">
    {recommendations.map(post => <Components.PostsItem post={post} key={post._id} currentUser={currentUser}/>)}
  </Section>
};

registerComponent('RecommendationsPage', RecommendationsPage,
  withRecommendations,
  withUser,
  withStyles(styles, {name:"RecommendationsPage"})
);
