// import { useEffect, useRef, useState } from "react";
// import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
// import { ApolloError, ApolloQueryResult, NetworkStatus, gql } from "@apollo/client";
// import { useQuery } from "@/lib/crud/useQuery"
// import take from "lodash/take";
// import isEqual from "lodash/isEqual"
// import type { LoadMoreCallback, LoadMoreProps } from "../../lib/crud/withMulti";
// import { apolloSSRFlag } from "../../lib/helpers";

// export type UsePaginatedResolverResult<
//   FragmentTypeName extends keyof FragmentTypes,
// > = {
//   loading: boolean,
//   loadingInitial: boolean,
//   loadingMore: boolean,
//   results?: FragmentTypes[FragmentTypeName][],
//   refetch: () => Promise<ApolloQueryResult<AnyBecauseHard>>,
//   error?: ApolloError,
//   count?: number,
//   loadMoreProps: LoadMoreProps,
//   loadMore: (limitOverride?: number) => void,
//   limit: number,
// }

// /**
//  * This hook provides a `useMulti`-like interface to use with custom paginated
//  * resolvers created on the server with `createPaginatedResolver`. Arguments
//  * match the semantics of `useMulti`.
//  */
// export const usePaginatedResolver = <
//   FragmentName extends keyof FragmentTypes
// >({
//   fragmentName,
//   resolverName,
//   limit: initialLimit = 10,
//   itemsPerPage = 10,
//   ssr = true,
//   skip = false,
// }: {
//   fragmentName: FragmentName,
//   resolverName: string,
//   limit?: number,
//   itemsPerPage?: number,
//   ssr?: boolean,
//   skip?: boolean,
// }): UsePaginatedResolverResult<FragmentName> => {
//   const [limit, setLimit] = useState(initialLimit);

//   const queryText = `
//     query get${resolverName}($limit: Int) {
//       ${resolverName}(limit: $limit) {
//         results {
//           ...${fragmentName}
//         }
//       }
//     }
//     ${fragmentTextForQuery(fragmentName)}
//   `

//   const query = gql`${queryText}`;

//   const {
//     data,
//     error,
//     loading,
//     refetch,
//     fetchMore,
//     networkStatus,
//   } = useQuery(query, {
//     // This is a workaround for a bug in apollo where setting `ssr: false` makes it not fetch
//     // the query on the client (see https://github.com/apollographql/apollo-client/issues/5918)
//     ssr: apolloSSRFlag(ssr),
//     notifyOnNetworkStatusChange: true,
//     skip,
//     pollInterval: 0,
//     fetchPolicy: "cache-and-network",
//     nextFetchPolicy: "cache-only",
//     variables: {
//       limit,
//     },
//   });

//   const count = data?.[resolverName]?.results?.length ?? 0;

//   const loadMore: LoadMoreCallback = (limitOverride?: number) => {
//     const newLimit = limitOverride ?? (limit + itemsPerPage);
//     void fetchMore({
//       variables: {
//         limit: newLimit,
//       },
//       updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
//     })
//     setLimit(newLimit);
//   };

//   let results = data?.[resolverName]?.results;
//   if (results && results.length > limit) {
//     results = take(results, limit);
//   }

//   const lastList = useRef<FragmentTypes[FragmentName][] | undefined>(undefined);
//   if (results?.length && results.length >= (lastList.current?.length ?? 0)) {
//     lastList.current = results;
//   }

//   if (error) {
//     // This error was already caught by the apollo middleware, but the
//     // middleware had no idea who made the query. To aid in debugging, log a
//     // stack trace here.
//     // eslint-disable-next-line no-console
//     console.error(error.message)
//   }

//   return {
//     loading: loading || networkStatus === NetworkStatus.fetchMore,
//     loadingInitial: networkStatus === NetworkStatus.loading,
//     loadingMore: networkStatus === NetworkStatus.fetchMore,
//     results: lastList.current,
//     refetch,
//     error,
//     count,
//     loadMoreProps: {
//       loadMore,
//       count,
//       loading,
//     },
//     loadMore,
//     limit,
//   };
// }
