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
  if (!recommendations)
    return <Components.PostsLoading/>
  
  const { SingleColumnSection, SectionTitle, PostsItem2 } = Components;
  
  return <SingleColumnSection>
    <SectionTitle title="Recommended" />
    {recommendations.map(post => <PostsItem2 post={post} key={post._id} currentUser={currentUser}/>)}
  </SingleColumnSection>
};

registerComponent('RecommendationsPage', RecommendationsPage,
  withRecommendations,
  withUser,
  withStyles(styles, {name:"RecommendationsPage"})
);
