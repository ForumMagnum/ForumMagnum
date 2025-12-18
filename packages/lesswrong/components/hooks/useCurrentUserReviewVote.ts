import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUserId } from "../common/withUser";
import { useQuery } from "@/lib/crud/useQuery";

export const reviewVotesForPostAndUserQuery = gql(`
  query reviewVotesForPostAndUser($postId: String!, $userId: String!) {
    reviewVotes(selector: { reviewVotesForPostAndUser: { postId: $postId, userId: $userId } }, limit: 1) {
      results {
        _id
        qualitativeScore
        quadraticScore
      }
    }
  }
`);

export function useCurrentUserReviewVote(postId: string, skip?: boolean) {
  const currentUserId = useCurrentUserId();
  const { data, loading } = useQuery(reviewVotesForPostAndUserQuery, {
    variables: { postId, userId: currentUserId! },
    skip: !currentUserId || skip,
  });

  return { vote: data?.reviewVotes?.results?.[0] ?? null, loading };
}
