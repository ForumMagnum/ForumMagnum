import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const UserClientIdsInfoQuery = gql(`
  query UserClientIdsInfoQuery($userId: String) {
    user(selector: { _id: $userId }) {
      result {
        ...UserClientIdsInfo
      }
    }
  }
`);

/**
 * Lazily fetch a single user's associated client IDs and alt-account flag. These
 * fields are expensive to resolve, so they are not loaded in bulk with the
 * moderation queue; instead they are fetched here only when an individual user's
 * moderation profile is opened.
 */
export function useUserClientIdsInfo(userId: string): UserClientIdsInfo | null {
  const { data } = useQuery(UserClientIdsInfoQuery, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-first',
  });
  return data?.user?.result ?? null;
}
