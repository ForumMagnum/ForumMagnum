import { useMulti } from "../../lib/crud/withMulti";

/**
 * Used to fetch a list of posts for moderation contexts.
 * To preserve user privacy, don't return drafts which have never been published.
 * This used to be implemented with LWEvents, but now we're just using the `wasEverUndrafted` field.
 */
export function usePublishedPosts(userId: string, contentLimit = 20) {
  const { results: posts = [], loading } = useMulti({
    terms:{ view:"sunshineNewUsersPosts", userId },
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: contentLimit
  });

  return {
    posts: loading ? undefined : posts,
    loading
  };
}
