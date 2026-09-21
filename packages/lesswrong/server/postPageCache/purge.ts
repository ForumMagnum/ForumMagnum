import { dangerouslyDeleteByTag, getCache, invalidateByTag } from '@vercel/functions';
import chunk from 'lodash/chunk';
import uniq from 'lodash/uniq';
import { isDevelopment } from '@/lib/executionEnvironment';

const isRunningOnVercel = !!process.env.VERCEL;

const MAX_TAGS_PER_PURGE_REQUEST = 100;

/**
 * `invalidate` marks entries stale: the next request is served the old
 * content while a fresh one is generated. `delete` removes them, so the next
 * request waits for a fresh render; used when content stops being visible.
 */
export type PurgeMode = 'invalidate' | 'delete';

/**
 * Purge every Vercel cache entry (CDN and Runtime Cache) carrying any of the
 * given tags. Throws on failure; callers run this inside `backgroundTask`.
 *
 * Inside a Vercel function the platform SDK is used. Elsewhere (yarn repl
 * scripts, migrations run from CI) the SDK silently does nothing, so the REST
 * API is used with VERCEL_CACHE_PURGE_TOKEN / VERCEL_CACHE_PURGE_PROJECT_ID /
 * VERCEL_CACHE_PURGE_TEAM_ID. In local development, where the SDK's cache is
 * an in-process fallback, that fallback is expired directly.
 */
export async function purgeCacheTags(tags: readonly string[], mode: PurgeMode): Promise<void> {
  for (const tagsBatch of chunk(uniq(tags), MAX_TAGS_PER_PURGE_REQUEST)) {
    if (isRunningOnVercel) {
      if (mode === 'delete') {
        await dangerouslyDeleteByTag(tagsBatch);
      } else {
        await invalidateByTag(tagsBatch);
      }
    } else if (process.env.VERCEL_CACHE_PURGE_TOKEN) {
      await purgeViaRestApi(tagsBatch, mode);
    } else if (isDevelopment) {
      await getCache().expireTag(tagsBatch);
    } else {
      throw new Error('Post page cache purge requested outside Vercel, but VERCEL_CACHE_PURGE_TOKEN is not configured');
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
