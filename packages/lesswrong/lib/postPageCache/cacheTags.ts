/** Tag shared by every cached logged-out post page and result, for purging everything at once. */
export const FORUM_WIDE_CACHE_TAG = 'lwcache:all';

export function postCacheTag(postId: string): string {
  return `post:${postId}`;
}
