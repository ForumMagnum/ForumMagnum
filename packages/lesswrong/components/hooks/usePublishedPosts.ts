import { useMulti } from "../../lib/crud/withMulti";

/**
 * Used to fetch a list of posts for moderation contexts.
 * To preserve user privacy, don't return drafts which have never been published.
 * 
 * We're doing this with a batch query against LWEvents instead of a resolver field on each post for performance reasons.
 * It's still a bit slow, probably because the LWEvents index goes name_userId_documentId,
 * and we aren't providing userId because we don't want to hide posts moved back to draft by someone else (i.e. an admin).
 */
export function usePublishedPosts(userId: string, contentLimit = 20) {
  const { results: posts = [], loading: postsLoading } = useMulti({
    terms:{ view:"sunshineNewUsersPosts", userId },
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: contentLimit
  });

  const draftPostIds = posts.filter(p => p.draft).map(p => p._id);

  const skipEvents = draftPostIds.length === 0;

  const { results: moveToDraftEvents, loading: lwEventsLoading } = useMulti({
    terms: { view: 'postEverPublished', postIds: draftPostIds },
    collectionName: "LWEvents",
    fragmentName: 'LWEventsDefaultFragment',
    skip: draftPostIds.length === 0,
    // Add a bit of padding in case someone's drafted and republished a post more than once
    limit: draftPostIds.length + 5
  });

  const everPublishedPostIds = new Set((moveToDraftEvents ?? []).map(event => event.documentId));

  const postsToDisplay = posts.filter((post) => !post.draft || everPublishedPostIds.has(post._id));

  // lwEventsLoading will be true if we're skipping it, which leads to incorrectly showing the spinner
  const loading = postsLoading || (lwEventsLoading && !skipEvents);

  return {
    posts: loading ? undefined : postsToDisplay,
    loading
  };
}
