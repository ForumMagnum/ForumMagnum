import { useQuery, gql, ApolloQueryResult } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { defaultAlgorithmSettings, isRecombeeAlgorithm } from '../../lib/collections/users/recommendationSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { cyrb53Rand } from '../../lib/random';
import { useEffect, useMemo } from 'react';
import { isServer } from '../../lib/executionEnvironment';

export const useRecommendations = (algorithm: RecommendationsAlgorithm): {
  recommendationsLoading: boolean,
  recommendations: PostsListWithVotesAndSequence[]|undefined,
}=> {
  const {data, loading} = useQuery(gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        ...PostsListWithVotesAndSequence
      }
    }
    ${fragmentTextForQuery("PostsListWithVotesAndSequence")}
  `, {
    variables: {
      count: algorithm?.count || 10,
      algorithm: algorithm || defaultAlgorithmSettings,
      batchKey: `recommendations-${cyrb53Rand(JSON.stringify(algorithm))}`
    },
    ssr: !isRecombeeAlgorithm(algorithm) || !isServer,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only'
  });

  return {
    recommendationsLoading: loading,
    recommendations: data?.Recommendations,
  };
}
