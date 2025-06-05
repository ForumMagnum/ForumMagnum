import { useState } from "react";
import { type OperationVariables, type QueryHookOptions, type ObservableQueryFields } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { Kind } from "graphql";
import { apolloSSRFlag } from "@/lib/helpers";
import isEqual from "lodash/isEqual";
import { useStabilizedCallback } from "./useDebouncedCallback";

interface UseLoadMoreProps<D extends { results: any[]; totalCount?: number | null }, T> {
  data?: D | null;
  loading: boolean;
  fetchMore: T;
  initialLimit: number;
  itemsPerPage: number;
  alwaysShowLoadMore?: boolean;
  enableTotal?: boolean;
  resetTrigger?: any; // When this changes, pagination resets to initial limit
}


export type LoadMoreCallback = () => Promise<unknown> | void;

export type LoadMoreProps = {
  loadMore: LoadMoreCallback;
  count: number;
  totalCount?: number;
  loading: boolean;
  hidden?: boolean;
};

export type WrappedFetchMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore']> = (options?: Parameters<T>[0]) => ReturnType<T>;

function useLoadMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore'], D extends { results: any[]; totalCount?: number | null }>({ 
  data, 
  loading, 
  fetchMore, 
  initialLimit, 
  itemsPerPage, 
  alwaysShowLoadMore, 
  enableTotal,
  resetTrigger,
}: UseLoadMoreProps<D, T>) {
  const [limit, setLimit] = useState(initialLimit);
  const [lastResetTrigger, setLastResetTrigger] = useState(resetTrigger);

  let effectiveLimit = limit;
  if (!isEqual(resetTrigger, lastResetTrigger)) {
    setLastResetTrigger(resetTrigger);
    setLimit(initialLimit);
    effectiveLimit = initialLimit;
  }

  const count = data?.results?.length ?? 0;
  const totalCount = data?.totalCount ?? undefined;

  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < (totalCount ?? 0)) : (count >= effectiveLimit));

  const loadMore: WrappedFetchMore<T> = useStabilizedCallback((options: Parameters<T>[0] = {}) => {
    const newLimit = options.variables && 'limit' in options.variables ? options.variables.limit : (effectiveLimit + itemsPerPage);
    
    const result = fetchMore({
      variables: { limit: newLimit },
      updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
    });
    setLimit(newLimit);
    return result as ReturnType<T>;
  });
  
  return {
    loadMore, 
    count, 
    totalCount, 
    loading,
    hidden: !showLoadMore, 
    limit: effectiveLimit,
    showLoadMore,
  };
}

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

export function useQueryWithLoadMore<
  TData extends Record<string, any>,
  TVariables extends OperationVariables
>(
  query: TypedDocumentNode<ValidPaginatedData<TData>, TVariables>,
  options: QueryHookOptions<ValidPaginatedData<TData>, TVariables> & PaginatedQueryOptions & {
    variables: TVariables & PaginatedQueryVariables;
  }
) {
  const {
    variables,
    ssr,
    notifyOnNetworkStatusChange = true,
    itemsPerPage = 10,
    alwaysShowLoadMore = false,
    ...remainingOptions
  } = options;

  const { limit, selector, ...remainingVariables } = variables ?? {};
  const initialLimit = (selector && 'limit' in selector && typeof selector.limit === 'number')
    ? selector.limit
    : (limit ?? 10);

  const patchedSsr = apolloSSRFlag(ssr);

  const optionsWithDefaults = {
    ...remainingOptions,
    ssr: patchedSsr,
    notifyOnNetworkStatusChange,
    variables: {
      ...({ selector, ...remainingVariables }) as TVariables,
      limit: initialLimit,
    }
  };

  const queryOutput = useQuery(query, optionsWithDefaults);
  const { data, loading, fetchMore } = queryOutput;

  const queryName = query.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet?.selections?.find(s => s.kind === Kind.FIELD)?.name?.value;
  const queryResult = data?.[queryName as keyof typeof data];

  const loadMoreProps = useLoadMore({
    data: queryResult,
    loading,
    fetchMore,
    initialLimit,
    itemsPerPage,
    alwaysShowLoadMore,
    enableTotal: variables.enableTotal,
    resetTrigger: variables.selector,
  });

  return {
    ...queryOutput,
    loadMoreProps,
  };
}
