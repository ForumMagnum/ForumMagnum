import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { getCache, type RuntimeCache } from '@vercel/functions';
import stringify from 'json-stringify-deterministic';
import { print, type DocumentNode, type ExecutionResult, type OperationDefinitionNode } from 'graphql';
import type { ResultOf, TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { OperationVariables } from '@apollo/client';
import { captureException } from '@/lib/sentryWrapper';
import { FORUM_WIDE_CACHE_TAG, postCacheTag } from '@/lib/postPageCache/cacheTags';
import { anonymousQueryCacheEnabledSetting } from '../databaseSettings';
import { backgroundTask } from '../utils/backgroundTask';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { runQueryNonThrowing } from '../vulcan-lib/query';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/** Bump when the stored envelope format, or the meaning of a cached result, changes. */
const CACHE_FORMAT_VERSION = 1;
const CACHE_TTL_SECONDS = 3 * 24 * 60 * 60;
/** Vercel Runtime Cache rejects (silently) serialized items above 2MB. */
const MAX_STORED_ITEM_BYTES = 1_900_000;
const CACHE_NAMESPACE = 'lw-anon-gql';

interface CachedOperationSpec {
  postIdsFromVariables?: (variables: Record<string, unknown>) => (string | null | undefined)[]
  postIdsFromResult?: (data: Record<string, any>) => (string | null | undefined)[]
}

/**
 * GraphQL operations whose results are shared between all logged-out
 * visitors of a post page, keyed by operation name. Every entry must be
 * purgeable by post tag, so each spec says where to find the post IDs the
 * result depends on. Operations that intentionally depend on per-visitor
 * state (client ID, sharing keys, revision previews) must not be listed.
 */
const cachedOperations: Record<string, CachedOperationSpec> = {
  PostsPageWrapper: { postIdsFromVariables: (variables) => [stringOrNull(variables.documentId)] },
  postCommentsThreadQuery: { postIdsFromVariables: collectPostIdValues },
  multiPostPingbacksListQuery: { postIdsFromVariables: collectPostIdValues },
  multiCommentReviewPillContainerQuery: { postIdsFromVariables: collectPostIdValues },
  CommentPermalink: { postIdsFromResult: (data) => [stringOrNull(data?.comment?.result?.postId)] },
  PostMetadata: { postIdsFromVariables: (variables) => [stringOrNull(variables.postId)] },
  CommentPermalinkMetadata: { postIdsFromResult: (data) => [stringOrNull(data?.comment?.result?.postId)] },
};

interface CacheEnvelope {
  v: number
  gz: string
}

let runtimeCache: RuntimeCache | null = null;

function getRuntimeCache(): RuntimeCache {
  if (!runtimeCache) {
    // Keys are already SHA-256 digests; the SDK's default key hash is 32-bit
    // and collides at our key volume.
    runtimeCache = getCache({ namespace: CACHE_NAMESPACE, keyHashFunction: identityKey });
  }
  return runtimeCache;
}

function identityKey(key: string): string {
  return key;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Collects the values of every `postId` key found anywhere in the variables. */
function collectPostIdValues(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectPostIdValues(item, found);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'postId' && typeof child === 'string') {
        found.push(child);
      } else {
        collectPostIdValues(child, found);
      }
    }
  }
  return found;
}

function getOperationName(query: DocumentNode): string | null {
  const operation = query.definitions.find((definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition');
  return operation?.name?.value ?? null;
}

function isContextEligibleForSharedCache(context: Partial<ResolverContext>): boolean {
  if (context.currentUser || context.userId) return false;
  // A logged-out visitor may still hold a sharing key granting access to a
  // private draft; that result must never be shared.
  if (context.searchParams?.get('key')) return false;
  return true;
}

function buildCacheKey(forumType: string, printedQuery: string, variables: unknown): string {
  const keyMaterial = stringify({ v: CACHE_FORMAT_VERSION, forumType, query: printedQuery, variables });
  return createHash('sha256').update(keyMaterial).digest('hex');
}

async function readCachedData(key: string): Promise<Record<string, any> | null> {
  const envelope = await getRuntimeCache().get(key) as CacheEnvelope | null | undefined;
  if (!envelope || envelope.v !== CACHE_FORMAT_VERSION || typeof envelope.gz !== 'string') {
    return null;
  }
  const json = await gunzipAsync(Buffer.from(envelope.gz, 'base64'));
  return JSON.parse(json.toString('utf8'));
}

async function storeResultData(key: string, data: Record<string, any>, postIds: string[], operationName: string): Promise<void> {
  const compressed = await gzipAsync(Buffer.from(JSON.stringify(data), 'utf8'));
  const envelope: CacheEnvelope = { v: CACHE_FORMAT_VERSION, gz: compressed.toString('base64') };
  if (envelope.gz.length > MAX_STORED_ITEM_BYTES) {
    logCacheEvent('store-skipped-too-large', operationName, envelope.gz.length);
    return;
  }
  const tags = [FORUM_WIDE_CACHE_TAG, ...postIds.map(postCacheTag)];
  await getRuntimeCache().set(key, envelope, { ttl: CACHE_TTL_SECONDS, tags, name: `${CACHE_NAMESPACE}:${operationName}` });
}

function logCacheEvent(event: string, operationName: string, value?: number): void {
  // Structured line for the log drain; charted by operation and event.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ lwAnonQueryCache: event, operation: operationName, value }));
}

/**
 * Like `runQueryNonThrowing`, but for logged-out contexts and a fixed set of
 * post-page operations the result is served from, and stored to, a cache
 * shared by every logged-out visitor. Cache misses are executed under a
 * freshly built anonymous context so that nothing request-specific can leak
 * into the shared result. Entries are tagged by post and purged by
 * `invalidatePostPageCache`.
 */
export async function runQueryNonThrowingWithAnonymousCache<TData extends Record<string, any>, TVariables extends OperationVariables>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: Partial<ResolverContext>,
): Promise<ExecutionResult<ResultOf<TypedDocumentNode<TData, TVariables>>>> {
  const forumType = context.forumType;
  const operationName = typeof query === 'string' ? null : getOperationName(query);
  const spec = operationName ? cachedOperations[operationName] : undefined;
  if (
    typeof query === 'string'
    || !operationName
    || !spec
    || !forumType
    || !anonymousQueryCacheEnabledSetting.get(forumType)
    || !isContextEligibleForSharedCache(context)
  ) {
    return runQueryNonThrowing(query, variables, context);
  }

  const key = buildCacheKey(forumType, print(query), variables);
  try {
    const cachedData = await readCachedData(key);
    if (cachedData) {
      logCacheEvent('hit', operationName);
      return { data: cachedData as ResultOf<TypedDocumentNode<TData, TVariables>> };
    }
  } catch (error) {
    captureException(error);
  }

  const anonymousContext = createAnonymousContext({ forumType, isSSR: true, locale: context.locale });
  const result = await runQueryNonThrowing(query, variables, anonymousContext);
  logCacheEvent('miss', operationName);

  if (!result.errors?.length && result.data) {
    const postIds = [
      ...(spec.postIdsFromVariables?.(variables) ?? []),
      ...(spec.postIdsFromResult?.(result.data) ?? []),
    ].filter((postId): postId is string => !!postId);
    backgroundTask(storeResultData(key, result.data, postIds, operationName));
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
