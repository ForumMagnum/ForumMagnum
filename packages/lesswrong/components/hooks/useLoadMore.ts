import { useCallback, useState } from "react";
import type { ObservableQueryFields, OperationVariables } from "@apollo/client";

interface UseLoadMoreProps<D extends { results: any[]; totalCount?: number }, T> {
  data?: D | null;
  loading: boolean;
  fetchMore: T;
  initialLimit?: number;
  itemsPerPage?: number;
  alwaysShowLoadMore?: boolean;
  enableTotal?: boolean;
}

export type WrappedFetchMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore']> = (options?: Parameters<T>[0]) => ReturnType<T>;

export function useLoadMore<T extends ObservableQueryFields<any, OperationVariables>['fetchMore'], D extends { results: any[]; totalCount?: number }>({ data, loading, fetchMore, initialLimit = 10, itemsPerPage = 10, alwaysShowLoadMore, enableTotal }: UseLoadMoreProps<D, T>) {
  const [limit, setLimit] = useState(initialLimit);

  const count = data?.results?.length ?? 0;
  const totalCount = data?.totalCount ?? 0;

  // TODO: figure out what to do about `count >= limit`, which in useMulti is `count >= effectiveLimit`
  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < totalCount) : (count >= limit));

  const loadMore: WrappedFetchMore<T> = useCallback((options: Parameters<T>[0] = {}) => {
    const newLimit = options.variables && 'limit' in options.variables ? options.variables.limit : (limit + itemsPerPage);
    const result = fetchMore({
      variables: {
        limit: newLimit,
      },
      updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
    });
    setLimit(newLimit);
    return result as ReturnType<T>;
  }, [limit, fetchMore, itemsPerPage]);
  
  return { loadMore, count, totalCount, loading, hidden: !showLoadMore };
}
