import { useQuery, gql, ApolloClient } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const recommendationsQuery = gql`
  query RecommendationsQuery($count: Int, $algorithm: JSON) {
    Recommendations(count: $count, algorithm: $algorithm) {
      ...PostsListWithVotesAndSequence
    }
  }
  ${fragmentTextForQuery("PostsListWithVotesAndSequence")}
`;

export const useRecommendations = (algorithm: RecommendationsAlgorithm): {
  recommendationsLoading: boolean,
  recommendations: PostsListWithVotesAndSequence[],
}=> {
  const {data, loading} = useQuery(recommendationsQuery, {
    variables: {
      count: algorithm?.count || 10,
      algorithm: algorithm || defaultAlgorithmSettings,
      batchKey: "recommendations",
    },
    ssr: true,
  });
  return {
    recommendationsLoading: loading,
    recommendations: data?.Recommendations ?? [],
  };
}

export const getRecommendations = async (
  client: ApolloClient<AnyBecauseHard>,
  algorithm: RecommendationsAlgorithm,
): Promise<PostsListWithVotesAndSequence[]> => {
  const queryResult = await client.query({
    query: recommendationsQuery,
    variables: {
      count: algorithm?.count || 10,
      algorithm: algorithm || defaultAlgorithmSettings,
      batchKey: "recommendations",
    },
  });
  return queryResult?.data?.Recomendations ?? [];
}
