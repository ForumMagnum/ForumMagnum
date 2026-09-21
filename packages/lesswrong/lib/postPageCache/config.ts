/**
 * Flags for the two logged-out post-page cache layers. Read directly from
 * environment variables (with literal names, so the edge bundle used by
 * middleware.ts can see them) and shared by middleware and server code so
 * both interpret the flags the same way.
 */
export const postPageCacheConfig = {
  anonymousQueryCacheEnabled: process.env.POST_PAGE_CACHE_ANONYMOUS_QUERY_CACHE_ENABLED === 'true',
  htmlCacheEnabled: process.env.POST_PAGE_CACHE_HTML_ENABLED === 'true',
};
