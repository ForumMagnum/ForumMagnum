import uniq from 'lodash/uniq';
import { postCacheTag } from '@/lib/postPageCache/config';
import { captureException } from '@/lib/sentryWrapper';
import { sleep } from '@/lib/utils/asyncUtils';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { backgroundTask, isInRequestContext } from '../utils/backgroundTask';
import { purgeCacheTags, type PurgeMode } from './purge';

const TRAILING_PURGE_DELAY_MS = 30_000;

export interface InvalidatePostPageCacheOptions {
  // Remove the entries instead of marking them stale, so that no visitor is
  // served the old content once more. For changes that make content stop
  // being publicly visible.
  hardDelete?: boolean
}

// Purges the cached logged-out renders (HTML and GraphQL results) of the given
// posts. Call after the database writes that change what a logged-out visitor
// sees on the post page have completed.
export async function invalidatePostPageCache(postIds: string | readonly string[], options?: InvalidatePostPageCacheOptions): Promise<void> {
  const tags = uniq(typeof postIds === 'string' ? [postIds] : postIds).map(postCacheTag);
  if (tags.length === 0) return;
  const mode: PurgeMode = options?.hardDelete ? 'delete' : 'invalidate';

  if (!isInRequestContext()) {
    // Scripts and migrations exit as soon as their entrypoint resolves, which
    // would drop background work.
    try {
      await purgeCacheTags(tags, mode);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Post page cache purge failed', error);
      captureException(error);
    }
    return;
  }

  backgroundTask(purgeCacheTags(tags, mode));
  // A render that was already in flight when the change happened can finish
  // after the first purge and re-fill the cache with pre-change content.
  backgroundTask(sleep(TRAILING_PURGE_DELAY_MS).then(() => purgeCacheTags(tags, mode)));
}

export async function invalidatePostPageCacheForVoteable(
  collectionName: CollectionNameString,
  document: { _id: string, postId?: string | null, pingbacks?: DbPost['pingbacks'] },
): Promise<void> {
  if (collectionName === 'Posts') {
    // Pages that list the post as a pingback show its score.
    await invalidatePostPageCache([document._id, ...getPingbackTargetPostIds(document.pingbacks)]);
  } else if (collectionName === 'Comments' && document.postId) {
    await invalidatePostPageCache(document.postId);
  }
}

// `pingbacks.Posts` holds the posts this document links to. Their pages list
// this post under "Mentioned in", with its title, score and status.
export function getPingbackTargetPostIds(pingbacks: DbPost['pingbacks']): string[] {
  const postIds: unknown = pingbacks?.Posts;
  if (!Array.isArray(postIds)) return [];
  return postIds.filter((postId): postId is string => typeof postId === 'string');
}

// Every post page shows the name and avatar of the post's authors, coauthors
// and commenters.
export async function invalidatePostPageCachesForUser(userId: string, context: ResolverContext): Promise<void> {
  const postIds = await context.repos.posts.getPostIdsWhereUserAppears(userId);
  await invalidatePostPageCache(postIds);
}

// Post pages show their sequence's title and navigation.
export async function invalidatePostPageCachesForSequence(sequenceId: string, context: ResolverContext): Promise<void> {
  const chapters = await context.Chapters.find({ sequenceId }, {}, { postIds: 1 }).fetch();
  await invalidatePostPageCache(filterNonnull(chapters.flatMap((chapter) => chapter.postIds ?? [])));
}
