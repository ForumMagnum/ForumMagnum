import { FORUM_WIDE_CACHE_TAG, postCacheTags } from '@/lib/postPageCache/cacheTags';
import { sleep } from '@/lib/utils/asyncUtils';
import { anonymousQueryCacheEnabledSetting, postPageHtmlCacheEnabledSetting } from '../databaseSettings';
import { backgroundTask } from '../utils/backgroundTask';
import { purgeCacheTags } from './purge';

/**
 * Delay before the second purge. A render that was already in flight when a
 * change happened can finish after the first purge and re-fill the cache with
 * pre-change content; the second purge catches renders that finish within
 * this window.
 */
const TRAILING_PURGE_DELAY_MS = 30_000;

const trailingPurgesInFlight = new Set<string>();

export function isPostPageCachingEnabled(): boolean {
  return anonymousQueryCacheEnabledSetting.get('LessWrong') || postPageHtmlCacheEnabledSetting.get('LessWrong');
}

/**
 * Purge the cached logged-out renders (HTML and GraphQL results) of the given
 * posts. Call this after the database writes that change what a logged-out
 * visitor sees on the post page have completed. Runs in the background and
 * never throws.
 */
export function invalidatePostPageCache(postIds: string | readonly string[]): void {
  if (!isPostPageCachingEnabled()) return;
  const tags = postCacheTags(typeof postIds === 'string' ? [postIds] : postIds);
  if (tags.length === 0) return;

  backgroundTask(purgeCacheTags(tags));

  const tagsNeedingTrailingPurge = tags.filter((tag) => !trailingPurgesInFlight.has(tag));
  if (tagsNeedingTrailingPurge.length === 0) return;
  for (const tag of tagsNeedingTrailingPurge) {
    trailingPurgesInFlight.add(tag);
  }
  backgroundTask(runTrailingPurge(tagsNeedingTrailingPurge));
}

async function runTrailingPurge(tags: string[]): Promise<void> {
  try {
    await sleep(TRAILING_PURGE_DELAY_MS);
    await purgeCacheTags(tags);
  } finally {
    for (const tag of tags) {
      trailingPurgesInFlight.delete(tag);
    }
  }
}

/**
 * Invalidate the post page affected by a change to a voteable document
 * (a vote, or a moderation change to the document itself).
 */
export function invalidatePostPageCacheForVoteable(
  collectionName: CollectionNameString,
  document: { _id: string, postId?: string | null },
): void {
  if (collectionName === 'Posts') {
    invalidatePostPageCache(document._id);
  } else if (collectionName === 'Comments' && document.postId) {
    invalidatePostPageCache(document.postId);
  }
}

/** Purge every cached post page. For changes that affect many pages at once. */
export function invalidateAllPostPageCaches(): void {
  if (!isPostPageCachingEnabled()) return;
  backgroundTask(purgeCacheTags([FORUM_WIDE_CACHE_TAG]));
}

/**
 * Invalidate every post page on which the user appears as author, coauthor,
 * or commenter (for display name and profile image changes).
 */
export async function invalidatePostPageCachesForUser(userId: string, context: ResolverContext): Promise<void> {
  if (!isPostPageCachingEnabled()) return;
  const postIds = await context.repos.posts.getPostIdsWhereUserAppears(userId);
  invalidatePostPageCache(postIds);
}
