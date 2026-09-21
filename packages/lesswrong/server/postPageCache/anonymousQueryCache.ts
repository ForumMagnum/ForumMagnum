import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { getCache } from '@vercel/functions';
import stringify from 'json-stringify-deterministic';
import { getOperationAST, print, type DocumentNode, type ExecutionResult } from 'graphql';
import type { ResultOf, TypedDocumentNode, VariablesOf } from '@graphql-typed-document-node/core';
import type { OperationVariables } from '@apollo/client';
import {
  CommentPermalinkDocument,
  CommentPermalinkMetadataDocument,
  PostMetadataDocument,
  PostsPageWrapperDocument,
  multiCommentReviewPillContainerQueryDocument,
  multiPostPingbacksListQueryDocument,
  postCommentsThreadQueryDocument,
} from '@/lib/generated/gql-codegen/graphql';
import { captureException } from '@/lib/sentryWrapper';
import { FORUM_WIDE_CACHE_TAG, postCacheTag, postPageCacheConfig } from '@/lib/postPageCache/config';
import { CACHED_POST_RENDER_HEADER } from '@/lib/postPageCache/cachedPostRoute';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { backgroundTask } from '../utils/backgroundTask';
import { runQueryNonThrowing } from '../vulcan-lib/query';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Part of every cache key. Bump when the meaning of a cached result changes
// without its query document changing.
const CACHE_FORMAT_VERSION = 1;
const CACHE_TTL_SECONDS = 3 * 24 * 60 * 60;
// Vercel Runtime Cache accepts `set` calls for serialized items above 2MB but
// never returns them.
const MAX_STORED_ITEM_BYTES = 1_900_000;
const CACHE_NAMESPACE = 'lw-anon-gql';

// Keys are already SHA-256 digests; the SDK's default key hash is 32-bit and
// collides at our key volume.
const runtimeCache = getCache({ namespace: CACHE_NAMESPACE, keyHashFunction: (key) => key });

type PostIds = (string | null | undefined)[];

interface CachedOperationSpec<TDocument> {
  postIdsFromVariables?: (variables: VariablesOf<TDocument>) => PostIds
  postIdsFromResult?: (data: ResultOf<TDocument>) => PostIds
}

function cachedOperation<TDocument extends DocumentNode>(
  document: TDocument,
  spec: CachedOperationSpec<TDocument>,
): [string, CachedOperationSpec<TDocument>] {
  const operationName = getOperationAST(document)?.name?.value;
  if (!operationName) {
    throw new Error('Cached operations must be named');
  }
  return [operationName, spec];
}

function postIdsFromSelector(variables: { selector?: object | null }): PostIds {
  return Object.values(variables.selector ?? {}).map((viewInput: unknown) => (
    viewInput && typeof viewInput === 'object' && 'postId' in viewInput && typeof viewInput.postId === 'string'
      ? viewInput.postId
      : null
  ));
}

// The post-page operations whose results are shared between all logged-out
// visitors, with the post IDs each result depends on. Results that yield no
// post ID are not stored, so that every entry can be purged by post tag.
// Operations whose results depend on per-visitor state (client ID, sharing
// keys, revision previews) must not be listed. Each spec is typed against its
// document when constructed; the map erases that.
const cachedOperations = new Map<string, CachedOperationSpec<any>>([
  cachedOperation(PostsPageWrapperDocument, { postIdsFromVariables: (variables) => [variables.documentId] }),
  cachedOperation(postCommentsThreadQueryDocument, { postIdsFromVariables: postIdsFromSelector }),
  cachedOperation(multiPostPingbacksListQueryDocument, { postIdsFromVariables: postIdsFromSelector }),
  cachedOperation(multiCommentReviewPillContainerQueryDocument, { postIdsFromVariables: postIdsFromSelector }),
  cachedOperation(CommentPermalinkDocument, { postIdsFromResult: (data) => [data.comment?.result?.postId] }),
  cachedOperation(PostMetadataDocument, { postIdsFromVariables: (variables) => [variables.postId] }),
  cachedOperation(CommentPermalinkMetadataDocument, { postIdsFromResult: (data) => [data.comment?.result?.postId] }),
]);

function isContextEligibleForSharedCache(context: Partial<ResolverContext>): boolean {
  // Only the loopback render behind /cache/posts shares results; the regular
  // /posts route runs every query as before.
  if (context.headers?.get(CACHED_POST_RENDER_HEADER) !== 'true') return false;
  if (context.currentUser || context.userId) return false;
  // A logged-out visitor may hold a sharing key granting access to a private
  // draft.
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

// One structured line per operation for the log drain, charted by operation
// and event.
function logCacheEvent(event: string, operationName: string, value?: number): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ lwAnonQueryCache: event, operation: operationName, value }));
}

export async function runQueryNonThrowingWithAnonymousCache<TData extends Record<string, any>, TVariables extends OperationVariables>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: Partial<ResolverContext>,
): Promise<ExecutionResult<TData>> {
  const forumType = context.forumType;
  const operationName = typeof query === 'string' ? null : getOperationAST(query)?.name?.value;
  const spec = operationName ? cachedOperations.get(operationName) : undefined;
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

  // A fresh anonymous context, so that nothing request-specific reaches the
  // shared result.
  const result = await runQueryNonThrowing(query, variables, { forumType, isSSR: true });
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
