import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

interface RecommendationResultPostsList {
  id: string,
  post: PostsList,
}

export const useRecommendations = (algorithm: RecommendationsAlgorithm): {
  recommendationsLoading: boolean,
  recommendations: RecommendationResultPostsList[]|undefined,
}=> {
  const {data, loading} = useQuery(gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        id
        post {
          ...PostsList
        }
      }
    }
    ${fragmentTextForQuery("PostsList")}
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
