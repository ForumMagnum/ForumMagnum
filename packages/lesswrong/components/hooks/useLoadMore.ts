import { useCallback, useState, useEffect } from "react";
import type { ObservableQueryFields, OperationVariables } from "@apollo/client";
import isEqual from "lodash/isEqual";

interface UseLoadMoreProps<D extends { results: any[]; totalCount?: number | null }, T> {
  data?: D | null;
  loading: boolean;
  fetchMore: T;
  initialLimit?: number;
  itemsPerPage?: number;
  alwaysShowLoadMore?: boolean;
  enableTotal?: boolean;
  resetTrigger?: any; // When this changes, pagination resets to initial limit
}

export type WrappedFetchMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore']> = (options?: Parameters<T>[0]) => ReturnType<T>;

export function useLoadMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore'], D extends { results: any[]; totalCount?: number | null }>({ 
  data, 
  loading, 
  fetchMore, 
  initialLimit = 10, 
  itemsPerPage = 10, 
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

  const loadMore: WrappedFetchMore<T> = useCallback((options: Parameters<T>[0] = {}) => {
    const newLimit = options.variables && 'limit' in options.variables ? options.variables.limit : (effectiveLimit + itemsPerPage);
    
    // Simplified fetchMore call - limit is now top-level in the new GraphQL structure
    const result = fetchMore({
      variables: {
        limit: newLimit,
      },
      updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
    });
    setLimit(newLimit);
    return result as ReturnType<T>;
  }, [effectiveLimit, fetchMore, itemsPerPage]);
  
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
