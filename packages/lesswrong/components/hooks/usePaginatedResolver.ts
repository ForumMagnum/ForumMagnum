import { useState } from "react";
import { fragmentTextForQuery } from "../../lib/vulcan-lib";
import { ApolloError, ApolloQueryResult, NetworkStatus, gql, useQuery } from "@apollo/client";
import take from "lodash/take";
import type { LoadMoreCallback, LoadMoreProps } from "../../lib/crud/withMulti";

export type UsePaginatedResolverResult<
  FragmentTypeName extends keyof FragmentTypes,
> = {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  results?: FragmentTypes[FragmentTypeName][],
  refetch: () => Promise<ApolloQueryResult<AnyBecauseHard>>,
  error?: ApolloError,
  count?: number,
  loadMoreProps: LoadMoreProps,
  loadMore: (limitOverride?: number) => void,
  limit: number,
}

export const usePaginatedResolver = <
  FragmentName extends keyof FragmentTypes
>({
  fragmentName,
  resolverName,
  limit: initialLimit = 10,
  itemsPerPage = 10,
  ssr = true,
  skip = false,
}: {
  fragmentName: FragmentName,
  resolverName: string,
  limit?: number,
  itemsPerPage?: number,
  ssr?: boolean,
  skip?: boolean,
}): UsePaginatedResolverResult<FragmentName> => {
  const [limit, setLimit] = useState(initialLimit);

  const query = gql`
    query get${resolverName}($limit: Int) {
      ${resolverName}(limit: $limit) {
        results {
          ...${fragmentName}
        }
      }
    }
    ${fragmentTextForQuery(fragmentName)}
  `;

  const {
    data,
    error,
    loading,
    refetch,
    fetchMore,
    networkStatus,
  } = useQuery(query, {
    ssr,
    skip,
    variables: {
      limit,
    },
  });

  const count = (data &&
    data[resolverName] &&
    data[resolverName].results &&
    data[resolverName].results.length) ?? 0;

  const loadMore: LoadMoreCallback = (limitOverride?: number) => {
    const newLimit = limitOverride ?? (limit + itemsPerPage);
    void fetchMore({
      variables: {
        limit: newLimit,
      },
      updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
    })
    setLimit(newLimit);
  };

  let results = data?.[resolverName]?.results;
  if (results && results.length > limit) {
    results = take(results, limit);
  }

  if (error) {
    // This error was already caught by the apollo middleware, but the
    // middleware had no idea who  made the query. To aid in debugging, log a
    // stack trace here.
    // eslint-disable-next-line no-console
    console.error(error.message)
  }

  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results,
    refetch,
    error,
    count,
    loadMoreProps: {
      loadMore,
      count,
      loading,
    },
    loadMore,
    limit,
  };
}
