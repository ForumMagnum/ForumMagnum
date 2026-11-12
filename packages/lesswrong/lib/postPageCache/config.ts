// Read with literal env var names so that bundlers can inline them.
export const postPageCacheConfig = {
  anonymousQueryCacheEnabled: process.env.POST_PAGE_CACHE_ANONYMOUS_QUERY_CACHE_ENABLED === 'true',
  htmlCacheEnabled: process.env.POST_PAGE_CACHE_HTML_ENABLED === 'true',
};

// Carried by every cached logged-out post page and result, so that everything
// can be purged at once.
export const FORUM_WIDE_CACHE_TAG = 'lwcache:all';

export function postCacheTag(postId: string): string {
  return `post:${postId}`;
}
