import { invalidateByTag } from '@vercel/functions';
import { isAnyTest, isDevelopment } from '@/lib/executionEnvironment';
import {
  vercelCachePurgeProjectIdSetting,
  vercelCachePurgeTeamIdSetting,
  vercelCachePurgeTokenSetting,
} from '../databaseSettings';

const isRunningOnVercel = !!process.env.VERCEL;

const MAX_TAGS_PER_PURGE_REQUEST = 100;

/**
 * Purge every Vercel cache entry (CDN and Runtime Cache) carrying any of the
 * given tags, with stale-while-revalidate semantics: the next request for a
 * purged entry is served the old content while a fresh one is generated.
 *
 * Inside a Vercel function this uses the platform SDK. Elsewhere (yarn repl
 * scripts, migrations run from CI) the SDK silently does nothing, so the
 * REST API is used instead; that path needs the
 * `private_postPageCache_vercelPurgeToken` and `..._vercelProjectId` settings.
 *
 * Throws on failure; callers run this inside `backgroundTask`.
 */
export async function purgeCacheTags(tags: readonly string[]): Promise<void> {
  const uniqueTags = Array.from(new Set(tags));
  for (let i = 0; i < uniqueTags.length; i += MAX_TAGS_PER_PURGE_REQUEST) {
    const chunk = uniqueTags.slice(i, i + MAX_TAGS_PER_PURGE_REQUEST);
    if (isRunningOnVercel) {
      await invalidateByTag(chunk);
    } else {
      await purgeViaRestApi(chunk);
    }
  }
}

async function purgeViaRestApi(tags: string[]): Promise<void> {
  const token = vercelCachePurgeTokenSetting.get('LessWrong');
  const projectId = vercelCachePurgeProjectIdSetting.get('LessWrong');
  const teamId = vercelCachePurgeTeamIdSetting.get('LessWrong');
  if (!token || !projectId) {
    if (isDevelopment || isAnyTest) {
      return;
    }
    throw new Error('Post page cache purge requested outside Vercel, but private_postPageCache_vercelPurgeToken / private_postPageCache_vercelProjectId are not configured');
  }

  const url = new URL('https://api.vercel.com/v1/edge-cache/invalidate-by-tags');
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
