import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

export const useRecommendations = (algorithm: RecommendationsAlgorithm): {
  recommendationsLoading: boolean,
  recommendations: PostsListWithVotes[]|undefined,
}=> {
  const {data, loading} = useQuery(gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        ...PostsListWithVotes
      }
    }
    ${fragmentTextForQuery("PostsListWithVotes")}
  `, {
    variables: {
      count: algorithm?.count || 10,
      algorithm: algorithm || defaultAlgorithmSettings,
    },
    ssr: true,
  });
  return {
    recommendationsLoading: loading,
    recommendations: data?.Recommendations,
  };
}
