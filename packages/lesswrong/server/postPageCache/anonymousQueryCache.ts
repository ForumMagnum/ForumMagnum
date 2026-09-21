import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { getCache } from '@vercel/functions';
import stringify from 'json-stringify-deterministic';
import { getOperationAST, print, type ExecutionResult } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { OperationVariables } from '@apollo/client';
import { captureException } from '@/lib/sentryWrapper';
import { FORUM_WIDE_CACHE_TAG, postCacheTag } from '@/lib/postPageCache/cacheTags';
import { postPageCacheConfig } from '@/lib/postPageCache/config';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { backgroundTask } from '../utils/backgroundTask';
import { runQueryNonThrowing } from '../vulcan-lib/query';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/** Part of every cache key; bump when the meaning of a cached result changes without its query document changing. */
const CACHE_FORMAT_VERSION = 1;
const CACHE_TTL_SECONDS = 3 * 24 * 60 * 60;
/** Vercel Runtime Cache silently rejects serialized items above 2MB. */
const MAX_STORED_ITEM_BYTES = 1_900_000;
const CACHE_NAMESPACE = 'lw-anon-gql';

// Keys are already SHA-256 digests; the SDK's default key hash is 32-bit and
// collides at our key volume.
const runtimeCache = getCache({ namespace: CACHE_NAMESPACE, keyHashFunction: (key) => key });

/** Variables of the list queries: a selector object whose single view input may name the post. */
interface SelectorVariables {
  selector?: Record<string, { postId?: string | null } | null | undefined> | null
}

interface CommentResultData {
  comment?: { result?: { postId?: string | null } | null } | null
}

/**
 * The post-page operations whose results are shared between all logged-out
 * visitors, with the post IDs each result depends on. Results that yield no
 * post ID are not stored, so every entry can be purged by post tag.
 * Operations that depend on per-visitor state (client ID, sharing keys,
 * revision previews) must not be listed.
 */
const cachedOperations: Record<string, {
  postIdsFromVariables?: (variables: any) => (string | null | undefined)[]
  postIdsFromResult?: (data: any) => (string | null | undefined)[]
}> = {
  PostsPageWrapper: { postIdsFromVariables: (variables: { documentId?: string | null }) => [variables.documentId] },
  postCommentsThreadQuery: { postIdsFromVariables: postIdsFromSelector },
  multiPostPingbacksListQuery: { postIdsFromVariables: postIdsFromSelector },
  multiCommentReviewPillContainerQuery: { postIdsFromVariables: postIdsFromSelector },
  CommentPermalink: { postIdsFromResult: (data: CommentResultData) => [data.comment?.result?.postId] },
  PostMetadata: { postIdsFromVariables: (variables: { postId?: string | null }) => [variables.postId] },
  CommentPermalinkMetadata: { postIdsFromResult: (data: CommentResultData) => [data.comment?.result?.postId] },
};

function postIdsFromSelector(variables: SelectorVariables): (string | null | undefined)[] {
  return Object.values(variables.selector ?? {}).map((viewInput) => viewInput?.postId);
}

function isContextEligibleForSharedCache(context: Partial<ResolverContext>): boolean {
  if (context.currentUser || context.userId) return false;
  // A logged-out visitor may hold a sharing key granting access to a private
  // draft; that result must never be shared.
  if (context.searchParams?.get('key')) return false;
  return true;
}

function buildCacheKey(forumType: string, printedQuery: string, variables: unknown): string {
  const keyMaterial = stringify({ v: CACHE_FORMAT_VERSION, forumType, query: printedQuery, variables });
  return createHash('sha256').update(keyMaterial).digest('hex');
}

async function readCachedData<TData>(key: string): Promise<TData | null> {
  const compressed = await runtimeCache.get(key);
  if (typeof compressed !== 'string') return null;
  const json = await gunzipAsync(Buffer.from(compressed, 'base64'));
  return JSON.parse(json.toString('utf8'));
}

async function storeResultData(key: string, data: Record<string, any>, postIds: string[], operationName: string): Promise<void> {
  const compressed = (await gzipAsync(Buffer.from(JSON.stringify(data), 'utf8'))).toString('base64');
  if (compressed.length > MAX_STORED_ITEM_BYTES) {
    logCacheEvent('store-skipped-too-large', operationName, compressed.length);
    return;
  }
  const tags = [FORUM_WIDE_CACHE_TAG, ...postIds.map(postCacheTag)];
  await runtimeCache.set(key, compressed, { ttl: CACHE_TTL_SECONDS, tags, name: `${CACHE_NAMESPACE}:${operationName}` });
}

function logCacheEvent(event: string, operationName: string, value?: number): void {
  // Structured line for the log drain; charted by operation and event.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ lwAnonQueryCache: event, operation: operationName, value }));
}

/**
 * `runQueryNonThrowing` with a cache shared by all logged-out visitors, for
 * the post-page operations listed in `cachedOperations`. Cache misses run
 * under a sanitized anonymous context so nothing request-specific reaches
 * the shared result.
 */
export async function runQueryNonThrowingWithAnonymousCache<TData extends Record<string, any>, TVariables extends OperationVariables>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: Partial<ResolverContext>,
): Promise<ExecutionResult<TData>> {
  const forumType = context.forumType;
  const operationName = typeof query === 'string' ? null : getOperationAST(query)?.name?.value ?? null;
  const spec = operationName ? cachedOperations[operationName] : undefined;
  if (
    typeof query === 'string'
    || !operationName
    || !spec
    || !forumType
    || !postPageCacheConfig.anonymousQueryCacheEnabled
    || !isContextEligibleForSharedCache(context)
  ) {
    return runQueryNonThrowing(query, variables, context);
  }

  const key = buildCacheKey(forumType, print(query), variables);
  try {
    const cachedData = await readCachedData<TData>(key);
    if (cachedData) {
      logCacheEvent('hit', operationName);
      return { data: cachedData };
    }
  } catch (error) {
    captureException(error);
  }

  const result = await runQueryNonThrowing(query, variables, { forumType, isSSR: true, locale: context.locale });
  logCacheEvent('miss', operationName);

  if (!result.errors?.length && result.data) {
    const postIds = filterNonnull([
      ...(spec.postIdsFromVariables?.(variables) ?? []),
      ...(spec.postIdsFromResult?.(result.data) ?? []),
    ]);
    if (postIds.length > 0) {
      backgroundTask(storeResultData(key, result.data, postIds, operationName));
    }
  }
  return result;
}

/** Throwing variant of `runQueryNonThrowingWithAnonymousCache`, mirroring `runQuery`. */
export async function runQueryWithAnonymousCache<TData extends Record<string, any>, TVariables extends OperationVariables>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: Partial<ResolverContext>,
) {
  const result = await runQueryNonThrowingWithAnonymousCache(query, variables, context);
  if (result.errors?.length) {
    throw new Error(result.errors[0].message);
  }
  return result;
}
