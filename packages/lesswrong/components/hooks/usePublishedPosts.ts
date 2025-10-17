import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const SunshinePostsListMultiQuery = gql(`
  query multiPostusePublishedPostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
  }
`);

/**
 * Used to fetch a list of posts for moderation contexts.
 * To preserve user privacy, don't return drafts which have never been published.
 * This used to be implemented with LWEvents, but now we're just using the `wasEverUndrafted` field.
 */
export function usePublishedPosts(userId: string, contentLimit = 20, ssr = true) {
  const { data, loading } = useQuery(SunshinePostsListMultiQuery, {
    variables: {
      selector: { sunshineNewUsersPosts: { userId } },
      limit: contentLimit,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    ssr,
  });

  const posts = data?.posts?.results;

  return {
    posts: loading ? undefined : posts,
    loading
  };
}
