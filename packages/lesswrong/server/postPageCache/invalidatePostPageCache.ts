import uniq from 'lodash/uniq';
import { postCacheTag } from '@/lib/postPageCache/cacheTags';
import { postPageCacheConfig } from '@/lib/postPageCache/config';
import { sleep } from '@/lib/utils/asyncUtils';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { backgroundTask } from '../utils/backgroundTask';
import { purgeCacheTags, type PurgeMode } from './purge';

/**
 * A render that was already in flight when a change happened can finish after
 * the first purge and re-fill the cache with pre-change content. The second
 * purge, this long after each change, catches renders that finish within the
 * window.
 */
const TRAILING_PURGE_DELAY_MS = 30_000;

function isPostPageCachingEnabled(): boolean {
  return postPageCacheConfig.anonymousQueryCacheEnabled || postPageCacheConfig.htmlCacheEnabled;
}

export interface InvalidatePostPageCacheOptions {
  /**
   * Remove the entries instead of marking them stale, so no visitor is served
   * the old content once more. For changes that make content stop being
   * publicly visible.
   */
  hardDelete?: boolean
}

/**
 * Purge the cached logged-out renders (HTML and GraphQL results) of the given
 * posts. Call this after the database writes that change what a logged-out
 * visitor sees on the post page have completed. Runs in the background and
 * never throws.
 */
export function invalidatePostPageCache(postIds: string | readonly string[], options?: InvalidatePostPageCacheOptions): void {
  if (!isPostPageCachingEnabled()) return;
  const tags = uniq(typeof postIds === 'string' ? [postIds] : postIds).map(postCacheTag);
  if (tags.length === 0) return;
  const mode: PurgeMode = options?.hardDelete ? 'delete' : 'invalidate';

  backgroundTask(purgeCacheTags(tags, mode));
  backgroundTask(sleep(TRAILING_PURGE_DELAY_MS).then(() => purgeCacheTags(tags, mode)));
}

/**
 * Invalidate the post page affected by a change to a voteable document. For
 * posts this includes the pages that list the post as a pingback, since they
 * show its score.
 */
export function invalidatePostPageCacheForVoteable(
  collectionName: CollectionNameString,
  document: { _id: string, postId?: string | null, pingbacks?: DbPost['pingbacks'] },
): void {
  if (collectionName === 'Posts') {
    invalidatePostPageCache([document._id, ...getPingbackTargetPostIds(document.pingbacks)]);
  } else if (collectionName === 'Comments' && document.postId) {
    invalidatePostPageCache(document.postId);
  }
}

/** Posts whose pages list this post in their pingbacks, and so display its title, score and status. */
export function getPingbackTargetPostIds(pingbacks: DbPost['pingbacks']): string[] {
  const postIds: unknown = pingbacks?.Posts;
  if (!Array.isArray(postIds)) return [];
  return postIds.filter((postId): postId is string => typeof postId === 'string');
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

/** Invalidate every post in a sequence (their pages show the sequence's title and navigation). */
export async function invalidatePostPageCachesForSequence(sequenceId: string, context: ResolverContext): Promise<void> {
  if (!isPostPageCachingEnabled()) return;
  const chapters = await context.Chapters.find({ sequenceId }, {}, { postIds: 1 }).fetch();
  invalidatePostPageCache(filterNonnull(chapters.flatMap((chapter) => chapter.postIds ?? [])));
}
