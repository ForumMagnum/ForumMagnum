import { useRef, useState } from "react";
import { type OperationVariables } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { Kind } from "graphql";
import isEqual from "lodash/isEqual";
import { useStabilizedCallbackAsync } from "./useDebouncedCallback";

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

  const { limit, selector } = variables;
  const initialLimit = (selector && 'limit' in selector && typeof selector.limit === 'number')
    ? selector.limit
    : (limit ?? 10);

  // Keep the last successful limit separately so a failed request can be retried.
  const [paginationState, setPaginationState] = useState({
    selector, limit: initialLimit, loadedLimit: initialLimit,
  });
  const enableTotal = variables.enableTotal;

  let pagination = paginationState;
  const selectorChanged = !isEqual(selector, pagination.selector);
  if (selectorChanged) {
    pagination = { selector, limit: initialLimit, loadedLimit: initialLimit };
    setPaginationState(pagination);
  }

  const queryOutput = useQuery(query, {
    ...remainingOptions,
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

  const queryName = query.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet?.selections?.find(s => s.kind === Kind.FIELD)?.name?.value;
  const queryResult = queryName ? data?.[queryName] : undefined;

  const count = queryResult?.results?.length ?? 0;
  const totalCount = queryResult?.totalCount ?? undefined;

  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < (totalCount ?? 0)) : (count >= pagination.loadedLimit));

  const loadMore = useStabilizedCallbackAsync<void>(async () => {
    const newLimit: number = pagination.loadedLimit + itemsPerPage;
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
  });

  return {
    ...queryOutput,
    data,
    loadMoreProps: {
      loadMore,
      count,
      totalCount,
      loading,
      hidden: !showLoadMore,
      limit: pagination.loadedLimit,
      showLoadMore,
    },
  };
}
