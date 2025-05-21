import { useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { apolloSSRFlag } from '../../lib/helpers';
import { defaultAlgorithmSettings, RecommendationsAlgorithm } from "../../lib/collections/users/recommendationSettings";

export const useRecommendations = ({
  algorithm,
  ssr = true,
}: {
  algorithm: RecommendationsAlgorithm;
  ssr?: boolean;
}): {
  recommendationsLoading: boolean;
  recommendations: PostsListWithVotesAndSequence[] | undefined;
} => {
  const { data, loading } = useQuery(
    gql(`
      query RecommendationsQuery($count: Int, $algorithm: JSON) {
        Recommendations(count: $count, algorithm: $algorithm) {
          ...PostsListWithVotesAndSequence
        }
      }
    `),
    {
      variables: {
        count: algorithm?.count || 10,
        algorithm: algorithm || defaultAlgorithmSettings,
        batchKey: "recommendations",
      },
      // This is a workaround for a bug in apollo where setting `ssr: false` makes it not fetch
      // the query on the client (see https://github.com/apollographql/apollo-client/issues/5918)
      ssr: apolloSSRFlag(ssr),
    }
  );
  return {
    recommendationsLoading: loading,
    recommendations: data?.Recommendations ?? undefined,
  };
};
