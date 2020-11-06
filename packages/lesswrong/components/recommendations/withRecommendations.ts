import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { getFragment } from '../../lib/vulcan-lib';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';

export  const withRecommendations = component => {
  const recommendationsQuery = gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        ...PostsList
      }
    }
    ${getFragment("PostsList")}
  `;

  return graphql(recommendationsQuery,
    {
      alias: "withRecommendations",
      options: (props: any) => ({
        variables: {
          count: props.algorithm?.count || 10,
          algorithm: props.algorithm || defaultAlgorithmSettings,
        }
      }),
      props(props: any) {
        return {
          recommendationsLoading: props.data.loading,
          recommendations: props.data.Recommendations,
        }
      }
    }
  )(component);
}
