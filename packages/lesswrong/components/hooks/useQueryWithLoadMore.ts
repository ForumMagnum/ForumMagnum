import { useRef, useState } from "react";
import { NetworkStatus, type OperationVariables, type WatchQueryFetchPolicy } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { Kind } from "graphql";
import isEqual from "lodash/isEqual";
import { useStabilizedCallbackAsync } from "./useDebouncedCallback";
import { useForumType } from "./useForumType";
import { maxDocumentsPerRequestSetting } from "@/lib/instanceSettings";

// Safe to import because it's imported only for its type
// eslint-disable-next-line no-restricted-imports
import { useQuery as useQueryApollo } from "@apollo/client/react";

export type LoadMoreCallback = () => Promise<unknown> | void;

export type LoadMoreProps = {
  loadMore: LoadMoreCallback;
  count: number;
  totalCount?: number;
  loading: boolean;
  hidden?: boolean;
};

interface PaginatedQueryVariables extends OperationVariables {
  selector?: Record<string, unknown>;
  limit?: number;
  enableTotal?: boolean;
}

interface PaginatedQueryOptions {
  itemsPerPage?: number;
  alwaysShowLoadMore?: boolean;
}

// Type constraint for paginated results
interface PaginatedResult {
  results: any[];
  totalCount?: number | null;
}

// Helper to check if a query returns paginated data
type HasPaginatedField<TData> = {
  [K in keyof TData]: TData[K] extends PaginatedResult | null | undefined ? K : never;
}[keyof TData];

// Constrain TData to have at least one field with paginated results
type ValidPaginatedData<TData> = HasPaginatedField<TData> extends never | undefined ? never : TData;

export type WrappedFetchMore = () => Promise<void>

interface PaginationState {
  selector?: Record<string, unknown>;
  limit: number;
  loadedLimit: number;
  preloadedLimit?: number;
}

interface PreloadedPage<TData, TVariables> {
  variables: TVariables;
  shownData: TData;
  data?: TData;
}

/**
 * Whether a preloaded page is the one that loading more would show now. It
 * isn't if the list has changed since the page was requested (eg it was
 * refetched after a mutation): revealing it would replace the list with an
 * older version of itself.
 */
function isPreloadOfNextPage<TData, TVariables>(
  page: PreloadedPage<TData, TVariables> | null,
  shownData: TData | undefined,
  nextVariables: TVariables,
): page is PreloadedPage<TData, TVariables> {
  return !!page && page.shownData === shownData && isEqual(page.variables, nextVariables);
}

interface PreloadedPageFetchPolicies {
  fetchPolicy: WatchQueryFetchPolicy;
  nextFetchPolicy?: () => WatchQueryFetchPolicy;
}

const keepCacheFirst = (): WatchQueryFetchPolicy => "cache-first";

/**
 * A page revealed from a preload is already in the cache, so the caller's
 * fetch policies must not request it a second time.
 *
 * If the caller has a nextFetchPolicy, cache-first may already be the query's
 * current policy, and when variables change apollo replaces a fetchPolicy that
 * matches the current one with the caller's initial policy. A nextFetchPolicy
 * function takes precedence over that. It's only passed where the caller has a
 * nextFetchPolicy of their own to go back to afterwards, because apollo ignores
 * options that are undefined, so the function would otherwise stay in effect.
 */
function getPreloadedPageFetchPolicies(callerHasNextFetchPolicy: boolean): PreloadedPageFetchPolicies {
  return callerHasNextFetchPolicy
    ? { fetchPolicy: "cache-first", nextFetchPolicy: keepCacheFirst }
    : { fetchPolicy: "cache-first" };
}

export function useQueryWithLoadMore<
  TData extends Record<string, any>,
  TVariables extends OperationVariables
>(
  query: TypedDocumentNode<ValidPaginatedData<TData>, TVariables>,
  options: useQueryApollo.Options<NoInfer<ValidPaginatedData<TData>>, NoInfer<TVariables>> & PaginatedQueryOptions & {
    variables: TVariables & PaginatedQueryVariables;
    // Prevent anyone from pointlessly passing `true`, which we assign by default inside the hook.
    notifyOnNetworkStatusChange?: false;
  }
) {
  const {
    variables,
    ssr = true,
    notifyOnNetworkStatusChange = true,
    itemsPerPage = 10,
    alwaysShowLoadMore = false,
    ...remainingOptions
  } = options;

  const { forumType } = useForumType();
  const { limit, selector } = variables;
  const initialLimit = (selector && 'limit' in selector && typeof selector.limit === 'number')
    ? selector.limit
    : (limit ?? 10);

  // Keep the last successful limit separately so a failed request can be retried.
  const [paginationState, setPaginationState] = useState<PaginationState>({
    selector, limit: initialLimit, loadedLimit: initialLimit,
  });
  const enableTotal = variables.enableTotal;

  let pagination = paginationState;
  const selectorChanged = !isEqual(selector, pagination.selector);
  if (selectorChanged) {
    pagination = { selector, limit: initialLimit, loadedLimit: initialLimit };
    setPaginationState(pagination);
  }

  const showingPreloadedPage = pagination.limit === pagination.preloadedLimit;
  const queryOutput = useQuery(query, {
    ...remainingOptions,
    ...(showingPreloadedPage && getPreloadedPageFetchPolicies(!!remainingOptions.nextFetchPolicy)),
    ssr,
    notifyOnNetworkStatusChange,
    variables: { ...variables, limit: pagination.limit },
  });
  const { loading, refetch } = queryOutput;
  const previousData = useRef(queryOutput.data);
  if (queryOutput.data || selectorChanged) {
    previousData.current = queryOutput.data;
  }
  // Keep the existing list visible while refetch changes the limit, including
  // when that list came from SSR injection rather than an Apollo query result.
  const data = queryOutput.data ?? (
    pagination.limit !== pagination.loadedLimit
      ? previousData.current
      : undefined
  );
  // When the limit changes, apollo can report the initial-load networkStatus
  // while the refetch is in flight. Callers treat that as "nothing loaded yet"
  // and replace the list with a loading placeholder, which collapses the page
  // and loses the scroll position, so report it as a fetchMore instead.
  const networkStatus = (data && queryOutput.networkStatus === NetworkStatus.loading && pagination.limit !== pagination.loadedLimit)
    ? NetworkStatus.fetchMore
    : queryOutput.networkStatus;

  const queryField = query.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet?.selections?.find(s => s.kind === Kind.FIELD);
  const queryName = queryField?.alias?.value ?? queryField?.name.value;
  const queryResult = queryName ? data?.[queryName] : undefined;

  const count = queryResult?.results?.length ?? 0;
  const totalCount = queryResult?.totalCount ?? undefined;

  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < (totalCount ?? 0)) : (count >= pagination.loadedLimit));

  const loadWithLimit = async (newLimit: number) => {
    const nextPagination = { ...pagination, limit: newLimit };
    setPaginationState(nextPagination);
    
    // We fetch the whole expanded list, so advance the watched query's variables.
    // fetchMore would write the expanded list under the original limit, where a
    // late initial response (including one started during hydration) can replace it.
    await refetch({ ...variables, limit: newLimit });
    // A response for an old selector must not advance the current selector's limit.
    setPaginationState(current => current === nextPagination
      ? { ...current, loadedLimit: newLimit }
      : current);
  };

  const nextLimit = pagination.loadedLimit + itemsPerPage;
  const nextVariables = { ...variables, limit: nextLimit };
  const preloadedPage = useRef<PreloadedPage<NonNullable<typeof queryOutput.data>, typeof nextVariables> | null>(null);

  // Requests the next page without changing anything that's rendered (it stays
  // out of the cache), so that loadMore can show it without waiting. Showing it
  // means putting it in the cache, which a no-cache caller has opted out of.
  const preload = useStabilizedCallbackAsync<void>(async () => {
    const shownData = queryOutput.data;
    if (!shownData || remainingOptions.fetchPolicy === "no-cache") return;
    if (isPreloadOfNextPage(preloadedPage.current, shownData, nextVariables)) return;

    const requested = { variables: nextVariables, shownData };
    preloadedPage.current = requested;
    try {
      const { data: preloadedData } = await queryOutput.client.query({ query, variables: nextVariables, fetchPolicy: "no-cache" });
      if (preloadedPage.current === requested) preloadedPage.current = { ...requested, data: preloadedData };
    } catch {
      // Not reported: loadMore makes the request again, and reports its failure.
      if (preloadedPage.current === requested) preloadedPage.current = null;
    }
  });

  const loadMore = useStabilizedCallbackAsync<void>(async () => {
    const preloaded = preloadedPage.current;
    // If a preload is still in flight, apollo deduplicates this request against it.
    if (!isPreloadOfNextPage(preloaded, queryOutput.data, nextVariables) || !preloaded.data) {
      await loadWithLimit(nextLimit);
      return;
    }
    preloadedPage.current = null;
    queryOutput.client.writeQuery({ query, variables: nextVariables, data: preloaded.data });
    setPaginationState({ ...pagination, limit: nextLimit, loadedLimit: nextLimit, preloadedLimit: nextLimit });
  });

  // Requests as many results as the server will return in a single query.
  const loadAll = useStabilizedCallbackAsync<void>(async () => {
    await loadWithLimit(maxDocumentsPerRequestSetting.get(forumType));
  });

  return {
    ...queryOutput,
    data,
    networkStatus,
    loadMoreProps: {
      loadMore,
      preload,
      loadAll,
      count,
      totalCount,
      loading,
      hidden: !showLoadMore,
      limit: pagination.loadedLimit,
      showLoadMore,
    },
  };
}
