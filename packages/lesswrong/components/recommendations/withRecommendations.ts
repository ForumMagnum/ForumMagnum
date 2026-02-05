import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
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
      },
      context: { batchKey: "recommendations" },
      ssr: ssr,
    }
  );
  return {
    recommendationsLoading: loading,
    recommendations: data?.Recommendations ?? undefined,
  };
};
