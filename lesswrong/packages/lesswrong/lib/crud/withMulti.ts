import { WatchQueryFetchPolicy, ApolloError, useQuery, NetworkStatus, gql, useApolloClient, useSuspenseQuery } from '@apollo/client';
import qs from 'qs';
import { useCallback, useMemo, useState } from 'react';
import * as _ from 'underscore';
import { invalidateQuery } from './cacheUpdates';
import { apolloSSRFlag } from '../helpers';
import { getMultiResolverName } from './utils';
import type { PrimitiveGraphQLType } from './types';
import { extractFragmentInfo } from "../vulcan-lib/handleOptions";
import { getFragment } from "../vulcan-lib/fragments";
import { pluralize } from "../vulcan-lib/pluralize";
import { camelCaseify } from "../vulcan-lib/utils";
import { collectionNameToTypeName } from "../vulcan-lib/getCollection";
import { useLocation, useNavigate } from "../routeUtil";

// Template of a GraphQL query for useMulti. A sample query might look
// like:
//
// mutation multiMovieQuery($input: MultiMovieInput) {
//   movies(input: $input) {
//     results {
//       _id
//       name
//       __typename
//     }
//     totalCount
//     __typename
//   }
// }
const multiClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: FragmentName,
  extraVariablesString: string,
}) => `query multi${typeName}Query($input: Multi${typeName}Input, ${extraVariablesString || ''}) {
  ${camelCaseify(pluralize(typeName))}(input: $input) {
    results {
      ...${fragmentName}
    }
    totalCount
    __typename
  }
}`;

interface GetGraphQLMultiQueryFromOptionsArgs {
  collectionName: CollectionNameString,
  typeName: string,
  fragmentName: FragmentName,
  fragment: any,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
}

export function getGraphQLMultiQueryFromOptions({collectionName, typeName, fragmentName, fragment, extraVariables}: GetGraphQLMultiQueryFromOptionsArgs) {
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  // build graphql query from options
  return gql`
    ${multiClientTemplate({ typeName, fragmentName, extraVariablesString })}
    ${fragment}
  `;
}

export interface UseMultiOptions<
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString
> {
  terms?: ViewTermsByCollectionName[CollectionName],
  extraVariablesValues?: any,
  pollInterval?: number,
  enableTotal?: boolean,
  enableCache?: boolean,
  extraVariables?: Record<string, PrimitiveGraphQLType>,
  fetchPolicy?: WatchQueryFetchPolicy,
  nextFetchPolicy?: WatchQueryFetchPolicy,
  collectionName: CollectionNameString,
  fragmentName: FragmentTypeName,
  limit?: number,
  itemsPerPage?: number,
  skip?: boolean,
  queryLimitName?: string,
  alwaysShowLoadMore?: boolean,
  createIfMissing?: Partial<ObjectsByCollectionName[CollectionName]>,
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
  FragmentTypeName extends keyof FragmentTypes,
> = {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  results?: Array<FragmentTypes[FragmentTypeName]>,
  totalCount?: number,
  refetch: any,
  invalidateCache: () => void,
  error: ApolloError|undefined,
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
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString = CollectionNamesByFragmentName[FragmentTypeName]
>({
  terms,
  extraVariablesValues,
  pollInterval = 0, //LESSWRONG: Polling defaults disabled
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraVariables,
  fetchPolicy,
  nextFetchPolicy,
  collectionName,
  fragmentName, //fragment,
  limit:initialLimit = 10, // Only used as a fallback if terms.limit is not specified
  itemsPerPage = 10,
  skip = false,
  queryLimitName,
  alwaysShowLoadMore = false,
  createIfMissing,
  ssr = true,
}: UseMultiOptions<FragmentTypeName,CollectionName>): UseMultiResult<FragmentTypeName> {
  const { query: locationQuery, location } = useLocation();
  const navigate = useNavigate();

  const locationQueryLimit = locationQuery && queryLimitName && !isNaN(parseInt(locationQuery[queryLimitName])) ? parseInt(locationQuery[queryLimitName]) : undefined;
  const termsLimit = terms?.limit; // FIXME despite the type definition, terms can actually be undefined
  const defaultLimit: number = locationQueryLimit ?? termsLimit ?? initialLimit

  const [ limit, setLimit ] = useState(defaultLimit);
  const [ lastTerms, setLastTerms ] = useState(_.clone(terms));
  
  const typeName = collectionNameToTypeName(collectionName);
  const fragment = getFragment(fragmentName);
  
  const query = getGraphQLMultiQueryFromOptions({ collectionName, typeName, fragmentName, fragment, extraVariables });
  const resolverName = getMultiResolverName(typeName);

  const graphQLVariables = useMemo(() => ({
    input: {
      terms: { ...terms, limit: defaultLimit },
      resolverArgs: extraVariablesValues,
      enableCache, enableTotal, createIfMissing
    },
    ...extraVariablesValues
  }), [terms, defaultLimit, enableCache, enableTotal, createIfMissing, extraVariablesValues]);

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
    // fetchPolicy,
    nextFetchPolicy: newNextFetchPolicy as WatchQueryFetchPolicy,
    // This is a workaround for a bug in apollo where setting `ssr: false` makes it not fetch
    // the query on the client (see https://github.com/apollographql/apollo-client/issues/5918)
    ssr: apolloSSRFlag(ssr),
    skip,
    notifyOnNetworkStatusChange: true
  }
  const {data, error, refetch, fetchMore, networkStatus} = useSuspenseQuery<any>(query, useQueryArgument);

  const client = useApolloClient();
  const invalidateCache = useCallback(() => invalidateQuery({
    client,
    query,
    variables: graphQLVariables,
  }), [client, query, graphQLVariables]);

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
    const newLimit = limitOverride || (effectiveLimit+itemsPerPage)
    if (queryLimitName) {
      const newQuery = {...locationQuery, [queryLimitName]: newLimit}
      navigate({...location, search: `?${qs.stringify(newQuery)}`})
    }
    void fetchMore({
      variables: {
        ...graphQLVariables,
        input: {
          ...graphQLVariables.input,
          terms: {...graphQLVariables.input.terms, limit: newLimit}
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return fetchMoreResult
      }
    })
    setLimit(newLimit)
  };
  
  // A bundle of props that you can pass to Components.LoadMore, to make
  // everything just work.
  const loadMoreProps = {
    loadMore, count, totalCount, loading: false,
    hidden: !showLoadMore,
  };
  
  let results = data?.[resolverName]?.results;
  if (results && results.length > limit) {
    results = _.take(results, limit);
  }
  
  return {
    loading: (false || networkStatus === NetworkStatus.fetchMore) && !skip,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results,
    totalCount: totalCount,
    refetch,
    invalidateCache,
    error,
    count,
    showLoadMore,
    loadMoreProps,
    loadMore,
    limit: effectiveLimit,
  };
}
