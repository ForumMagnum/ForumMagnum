/**
 * Cache tags shared by the two logged-out post-page cache layers (the CDN
 * HTML cache and the anonymous GraphQL result cache). Both layers tag every
 * stored entry with the post's tag and the forum-wide tag, so one purge call
 * clears both layers.
 */

export const FORUM_WIDE_CACHE_TAG = 'lwcache:all';

export function postCacheTag(postId: string): string {
  return `post:${postId}`;
}

export function postCacheTags(postIds: readonly string[]): string[] {
  const uniqueIds = Array.from(new Set(postIds.filter((id) => !!id)));
  return uniqueIds.map(postCacheTag);
}
