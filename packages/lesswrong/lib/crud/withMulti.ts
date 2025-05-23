import { WatchQueryFetchPolicy, ApolloError, useQuery, NetworkStatus, gql, useApolloClient, TypedDocumentNode } from '@apollo/client';
import qs from 'qs';
import { useCallback, useMemo, useState } from 'react';
import * as _ from 'underscore';
import { apolloSSRFlag } from '../helpers';
import { getMultiResolverName } from './utils';
import type { PrimitiveGraphQLType } from './types';
import { extractFragmentInfo } from "../vulcan-lib/handleOptions";
import { getFragment } from "../vulcan-lib/fragments";
import { collectionNameToTypeName } from "../generated/collectionTypeNames";
import { useLocation, useNavigate } from "../routeUtil";
import { FragmentDefinitionNode, print } from 'graphql';
// interface GetGraphQLMultiQueryFromOptionsArgs<F> {
//   collectionName: CollectionNameString,
//   typeName: string,
//   fragmentDoc: TypedDocumentNode<F, unknown>,
//   resolverName: string,
//   extraVariables?: Record<string, PrimitiveGraphQLType>,
// }

interface GetGraphQLMultiQueryFromOptionsArgs {
  collectionName: CollectionNameString,
  typeName: string,
  fragmentName: FragmentName,
  fragment: any,
  resolverName: string,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
}

// export function getGraphQLMultiQueryFromOptions<F>({ collectionName, typeName, fragmentDoc, resolverName, extraVariables }: GetGraphQLMultiQueryFromOptionsArgs<F>) {
//   const fragmentDefinition = fragmentDoc.definitions.find((d): d is FragmentDefinitionNode => d.kind === 'FragmentDefinition')
//   const fragmentName = fragmentDefinition?.name.value;
//   const fragmentText = print(fragmentDoc);
//   if (!fragmentName) {
//     throw new Error('Fragment name not found');
//   }

//   let extraVariablesString = ''
//   if (extraVariables) {
//     extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
//   }
//   const graphQLQueryText = `
//     query multi${typeName}Query($input: Multi${typeName}Input, ${extraVariablesString || ''}) {
//       ${resolverName}(input: $input) {
//         results {
//           ...${fragmentName}
//         }
//         totalCount
//         __typename
//       }
//     }
//     ${fragmentText}
//   `
//   // build graphql query from options
//   return gql(graphQLQueryText);
// }

export function getGraphQLMultiQueryFromOptions({collectionName, typeName, fragmentName, fragment, resolverName, extraVariables}: GetGraphQLMultiQueryFromOptionsArgs) {
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  // build graphql query from options
  return gql`
    query multi${typeName}Query($input: Multi${typeName}Input, ${extraVariablesString || ''}) {
      ${resolverName}(input: $input) {
        results {
          ...${fragmentName}
        }
        totalCount
        __typename
      }
    }
    ${fragment}
  `;
}

export interface UseMultiOptions<
  F extends keyof FragmentTypes,
  CollectionName extends CollectionNameString
> {
  terms?: ViewTermsByCollectionName[CollectionName],
  extraVariablesValues?: any,
  pollInterval?: number,
  enableTotal?: boolean,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
  fetchPolicy?: WatchQueryFetchPolicy,
  nextFetchPolicy?: WatchQueryFetchPolicy,
  collectionName: CollectionNameString,
  fragmentName: F,
  limit?: number,
  itemsPerPage?: number,
  skip?: boolean,
  queryLimitName?: string,
  alwaysShowLoadMore?: boolean,
  ssr?: boolean,
}

export type LoadMoreCallback = (limitOverride?: number) => void

export type LoadMoreProps = {
  loadMore: LoadMoreCallback
  count: number,
  totalCount?: number,
  loading: boolean,
  hidden?: boolean,
}

export type UseMultiResult<
  FragmentType extends keyof FragmentTypes,
> = {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  results?: Array<FragmentTypes[FragmentType]>,
  totalCount?: number,
  refetch: any,
  // invalidateCache: () => void,
  error: ApolloError | undefined,
  count?: number,
  showLoadMore: boolean,
  loadMoreProps: LoadMoreProps,
  loadMore: any,
  limit: number,
}

/**
 * React hook that queries a collection, and returns those results along with
 * some metadata about the query's progress and some options for refetching and
 * loading additional results.
 *
 * The preferred way to handle a Load More button is to take loadMoreProps from
 * the return value and pass it to Components.LoadMore, ie:
 *   <LoadMore {...loadMoreProps}/>
 * This will automatically take care of details like hiding the Load More button
 * if there are no more results, showing a result count if enableTotal is true,
 * showing a loading indicator, etc.
 */
export function useMulti<
  F extends keyof FragmentTypes,
  CollectionName extends CollectionNameString
>({
  terms,
  extraVariablesValues,
  pollInterval = 0, //LESSWRONG: Polling defaults disabled
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  extraVariables,
  fetchPolicy,
  nextFetchPolicy,
  collectionName,
  fragmentName,
  limit: initialLimit = 10, // Only used as a fallback if terms.limit is not specified
  itemsPerPage = 10,
  skip = false,
  queryLimitName,
  alwaysShowLoadMore = false,
  ssr = true,
}: UseMultiOptions<F, CollectionName>): UseMultiResult<F> {
  const { query: locationQuery, location } = useLocation();
  const navigate = useNavigate();

  const locationQueryLimit = locationQuery && queryLimitName && !isNaN(parseInt(locationQuery[queryLimitName])) ? parseInt(locationQuery[queryLimitName]) : undefined;
  const termsLimit = terms?.limit; // FIXME despite the type definition, terms can actually be undefined
  const defaultLimit: number = locationQueryLimit ?? termsLimit ?? initialLimit

  const [limit, setLimit] = useState(defaultLimit);
  const [lastTerms, setLastTerms] = useState(_.clone(terms));

  const typeName = collectionNameToTypeName[collectionName];

  const resolverName = getMultiResolverName(typeName);
  const query = getGraphQLMultiQueryFromOptions({ collectionName, typeName, fragmentName, fragment: getFragment(fragmentName), resolverName, extraVariables });

  const graphQLVariables = useMemo(() => ({
    input: {
      terms: { ...terms, limit: defaultLimit },
      resolverArgs: extraVariablesValues, enableTotal
    },
    ...extraVariablesValues
  }), [terms, defaultLimit, enableTotal, extraVariablesValues]);

  let effectiveLimit = limit;
  if (!_.isEqual(terms, lastTerms)) {
    setLastTerms(terms);
    setLimit(defaultLimit);
    effectiveLimit = defaultLimit;
  }

  // Due to https://github.com/apollographql/apollo-client/issues/6760 this is necessary to restore the Apollo 2.0 behavior for cache-and-network policies
  const newNextFetchPolicy = nextFetchPolicy || (fetchPolicy === "cache-and-network" || fetchPolicy === "network-only") ? "cache-only" : undefined

  const useQueryArgument = {
    variables: graphQLVariables,
    pollInterval,
    fetchPolicy,
    nextFetchPolicy: newNextFetchPolicy as WatchQueryFetchPolicy,
    // This is a workaround for a bug in apollo where setting `ssr: false` makes it not fetch
    // the query on the client (see https://github.com/apollographql/apollo-client/issues/5918)
    ssr: apolloSSRFlag(ssr),
    skip,
    notifyOnNetworkStatusChange: true
  }
  const { data, error, loading, refetch, fetchMore, networkStatus } = useQuery(query, useQueryArgument);

  if (error) {
    // This error was already caught by the apollo middleware, but the
    // middleware had no idea who  made the query. To aid in debugging, log a
    // stack trace here.
    // eslint-disable-next-line no-console
    console.error(error.message)
  }

  const count = (data && data[resolverName] && data[resolverName].results && data[resolverName].results.length) || 0;
  const totalCount = data && data[resolverName] && data[resolverName].totalCount;

  // If we did a query to count the total number of results (enableTotal),
  // show a Load More if we have fewer than that many results. If we didn't do
  // that, show a Load More if we got at least as many results as requested.
  // This means that if the total number of results exactly matches the limit,
  // the last click of Load More won't get any more documents.
  //
  // The caller of this function is responsible for showing a Load More button
  // if showLoadMore returned true.
  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < totalCount) : (count >= effectiveLimit));

  const loadMore: LoadMoreCallback = async (limitOverride?: number) => {
    const newLimit = limitOverride || (effectiveLimit + itemsPerPage)
    if (queryLimitName) {
      const newQuery = { ...locationQuery, [queryLimitName]: newLimit }
      navigate({ ...location, search: `?${qs.stringify(newQuery)}` })
    }
    void fetchMore({
      variables: {
        ...graphQLVariables,
        input: {
          ...graphQLVariables.input,
          terms: { ...graphQLVariables.input.terms, limit: newLimit }
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult ?? prev
    })
    setLimit(newLimit)
  };

  // A bundle of props that you can pass to Components.LoadMore, to make
  // everything just work.
  const loadMoreProps = {
    loadMore, count, totalCount, loading,
    hidden: !showLoadMore,
  };

  let results = data?.[resolverName]?.results;
  if (results && results.length > limit) {
    results = _.take(results, limit);
  }

  return {
    loading: (loading || networkStatus === NetworkStatus.fetchMore) && !skip,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results,
    totalCount: totalCount,
    refetch,
    // invalidateCache,
    error,
    count,
    showLoadMore,
    loadMoreProps,
    loadMore,
    limit: effectiveLimit,
  };
}
