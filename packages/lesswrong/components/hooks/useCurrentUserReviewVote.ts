import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUserId } from "../common/withUser";
import { useQuery } from "@/lib/crud/useQuery";

const reviewVotesForPostAndUserQuery = gql(`
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
  const { data } = useQuery(reviewVotesForPostAndUserQuery, {
    variables: { postId, userId: currentUserId! },
    skip: !currentUserId || skip,
  });

  return data?.reviewVotes?.results?.[0] ?? null;
}
