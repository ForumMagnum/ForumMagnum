import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { apolloSSRFlag } from '../../lib/helpers';

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
    gql`
      query RecommendationsQuery($count: Int, $algorithm: JSON) {
        Recommendations(count: $count, algorithm: $algorithm) {
          ...PostsListWithVotesAndSequence
        }
      }
      ${fragmentTextForQuery("PostsListWithVotesAndSequence")}
    `,
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
    recommendations: data?.Recommendations,
  };
};
