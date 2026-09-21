import { dangerouslyDeleteByTag, getCache, invalidateByTag } from '@vercel/functions';
import chunk from 'lodash/chunk';

const MAX_TAGS_PER_PURGE_REQUEST = 100;

// `invalidate` marks entries stale: the next request is served the old
// content while a fresh one is generated. `delete` removes them: the next
// request waits for a fresh render.
export type PurgeMode = 'invalidate' | 'delete';

let warnedNoPurgeTransport = false;

// Purges every Vercel cache entry (CDN and Runtime Cache) carrying any of the
// given tags. Throws on failure.
export async function purgeCacheTags(tags: readonly string[], mode: PurgeMode): Promise<void> {
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
