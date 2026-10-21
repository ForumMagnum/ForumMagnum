import { dangerouslyDeleteByTag, getCache, invalidateByTag } from '@vercel/functions';
import chunk from 'lodash/chunk';
import uniq from 'lodash/uniq';
import { postCacheTag } from '@/lib/postPageCache/config';
import { captureException } from '@/lib/sentryWrapper';
import { sleep } from '@/lib/utils/asyncUtils';
import { backgroundTask, isInRequestContext } from '../utils/backgroundTask';

const TRAILING_PURGE_DELAY_MS = 30_000;
// Vercel's purge API accepts at most 16 tags per call.
const MAX_TAGS_PER_PURGE_REQUEST = 16;

// `invalidate` marks entries stale: the next request is served the old
// content while a fresh one is generated. `delete` removes them: the next
// request waits for a fresh render.
type PurgeMode = 'invalidate' | 'delete';

interface InvalidatePostPageCacheOptions {
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

// `pingbacks.Posts` holds the posts this document links to. Their pages list
// this post under "Mentioned in", with its title, score and status.
export function getPingbackTargetPostIds(pingbacks: DbPost['pingbacks']): string[] {
  const postIds: unknown = pingbacks?.Posts;
  if (!Array.isArray(postIds)) return [];
  return postIds.filter((postId): postId is string => typeof postId === 'string');
}

let warnedNoPurgeTransport = false;

// Purges every Vercel cache entry (CDN and Runtime Cache) carrying any of the
// given tags. Throws on failure.
async function purgeCacheTags(tags: readonly string[], mode: PurgeMode): Promise<void> {
  for (const tagsBatch of chunk(tags, MAX_TAGS_PER_PURGE_REQUEST)) {
    if (process.env.VERCEL) {
      if (mode === 'delete') {
        await dangerouslyDeleteByTag(tagsBatch);
      } else {
        await invalidateByTag(tagsBatch);
      }
    } else if (process.env.VERCEL_CACHE_PURGE_TOKEN) {
      // Outside Vercel functions the SDK's purge functions silently do
      // nothing, so scripts and CI migrations go through the REST API.
      await purgeViaRestApi(tagsBatch, mode);
    } else {
      // Local development: the SDK's cache is an in-process fallback, which
      // `expireTag` clears directly.
      if (!warnedNoPurgeTransport) {
        warnedNoPurgeTransport = true;
        // eslint-disable-next-line no-console
        console.warn('VERCEL_CACHE_PURGE_TOKEN is not set; post page cache purges only affect this process\'s in-memory cache');
      }
      await getCache().expireTag(tagsBatch);
    }
  }
}

async function purgeViaRestApi(tags: string[], mode: PurgeMode): Promise<void> {
  const token = process.env.VERCEL_CACHE_PURGE_TOKEN;
  const projectId = process.env.VERCEL_CACHE_PURGE_PROJECT_ID;
  const teamId = process.env.VERCEL_CACHE_PURGE_TEAM_ID;
  if (!projectId) {
    throw new Error('VERCEL_CACHE_PURGE_PROJECT_ID is not configured');
  }
  const endpoint = mode === 'delete' ? 'dangerously-delete-by-tags' : 'invalidate-by-tags';
  const url = new URL(`https://api.vercel.com/v1/edge-cache/${endpoint}`);
  url.searchParams.set('projectIdOrName', projectId);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ tags, target: 'production' }),
  });
  if (!response.ok) {
    throw new Error(`Vercel cache purge failed with status ${response.status}: ${await response.text()}`);
  }
}
