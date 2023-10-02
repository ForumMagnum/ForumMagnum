import { WatchQueryFetchPolicy, ApolloError, useQuery, NetworkStatus, gql, useApolloClient } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import qs from 'qs';
import { useState } from 'react';
import compose from 'recompose/compose';
import withState from 'recompose/withState';
import * as _ from 'underscore';
import { extractCollectionInfo, extractFragmentInfo, getFragment, getCollection, pluralize, camelCaseify } from '../vulcan-lib';
import { useLocation, useNavigation } from '../routeUtil';
import { invalidateQuery } from './cacheUpdates';
import { isServer } from '../executionEnvironment';

// Template of a GraphQL query for withMulti/useMulti. A sample query might look
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

function getGraphQLQueryFromOptions({collectionName, collection, fragmentName, fragment, extraVariables}: {
  collectionName: CollectionNameString,
  collection: any,
  fragmentName: FragmentName,
  fragment: any,
  extraVariables: any,
}) {
  const typeName = collection.options.typeName;
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

/**
 * HoC for querying a collection for a list of results. DEPRECATED: you probably
 * want to be using the hook version, useMulti, instead.
 */
export function withMulti({
  limit = 10, // Only used as a fallback if terms.limit is not specified
  pollInterval = 0, //LESSWRONG: Polling is disabled, and by now it would probably horribly break if turned on
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraVariables,
  fetchPolicy,
  notifyOnNetworkStatusChange,
  propertyName = "results",
  collectionName, collection,
  fragmentName, fragment,
  terms: queryTerms,
}: {
  limit?: number,
  pollInterval?: number,
  enableTotal?: boolean,
  enableCache?: boolean,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  notifyOnNetworkStatusChange?: boolean,
  propertyName?: string,
  collectionName?: CollectionNameString,
  collection?: CollectionBase<any>,
  fragmentName?: FragmentName,
  fragment?: any,
  terms?: any,
}) {
  // if this is the SSR process, set pollInterval to null
  // see https://github.com/apollographql/apollo-client/issues/1704#issuecomment-322995855
  //pollInterval = typeof window === 'undefined' ? null : pollInterval;

  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  const typeName = collection!.options.typeName;
  const resolverName = collection!.options.multiResolverName;
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraVariables });

  return compose(
    // wrap component with HoC that manages the terms object via its state
    withState('paginationTerms', 'setPaginationTerms', (props: any) => {
      // get initial limit from props, or else options
      const paginationLimit = (props.terms && props.terms.limit) || limit;
      const paginationTerms = {
        limit: paginationLimit,
        itemsPerPage: paginationLimit,
      };

      return paginationTerms;
    }),

    // wrap component with graphql HoC
    graphql(
      query,

      {
        alias: `with${pluralize(typeName)}`,

        // graphql query options
        options(props: any) {
          const { terms, paginationTerms, ...rest } = props;
          // get terms from options, then props, then pagination
          const mergedTerms = { ...queryTerms, ...terms, ...paginationTerms };
          const graphQLOptions: any = {
            variables: {
              input: {
                terms: mergedTerms,
                enableCache,
                enableTotal,
              },
              ...(_.pick(rest, Object.keys(extraVariables || {})))
            },
            // note: pollInterval can be set to 0 to disable polling (20s by default)
            pollInterval,
            ssr: true,
          };

          if (fetchPolicy) {
            graphQLOptions.fetchPolicy = fetchPolicy;
          }

          // set to true if running into https://github.com/apollographql/apollo-client/issues/1186
          if (notifyOnNetworkStatusChange) {
            graphQLOptions.notifyOnNetworkStatusChange = notifyOnNetworkStatusChange;
          }

          return graphQLOptions;
        },

        // define props returned by graphql HoC
        props(props: any) {
          // see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
          if (!(props?.data)) throw new Error("Missing props.data");
          const refetch = props.data.refetch,
            // results = Utils.convertDates(collection, props.data[listResolverName]),
            results = props.data[resolverName] && props.data[resolverName].results,
            totalCount = props.data[resolverName] && props.data[resolverName].totalCount,
            networkStatus = props.data.networkStatus,
            loadingInitial = props.data.networkStatus === 1,
            loading = props.data.networkStatus === 1,
            loadingMore = props.data.networkStatus === 2,
            error = props.data.error;

          if (error) {
            // This error was already caught by the apollo middleware, but the
            // middleware had no idea who  made the query. To aid in debugging, log a
            // stack trace here.
            // eslint-disable-next-line no-console
            console.error(error.message)
          }

          return {
            // see https://github.com/apollostack/apollo-client/blob/master/src/queries/store.ts#L28-L36
            // note: loading will propably change soon https://github.com/apollostack/apollo-client/issues/831
            loading,
            loadingInitial,
            loadingMore,
            [propertyName]: results,
            totalCount,
            refetch,
            networkStatus,
            error,
            count: results && results.length,

            // regular load more (reload everything)
            loadMore(providedTerms: any) {
              // if new terms are provided by presentational component use them, else default to incrementing current limit once
              const newTerms =
                typeof providedTerms === 'undefined'
                  ? {
                      /*...props.ownProps.terms,*/ ...props.ownProps.paginationTerms,
                      limit: results.length + props.ownProps.paginationTerms.itemsPerPage,
                    }
                  : providedTerms;

              props.ownProps.setPaginationTerms(newTerms);
            },

            fragmentName,
            fragment,
            ...props.ownProps, // pass on the props down to the wrapped component
            data: props.data,
          };
        },
      }
    )
  );
}

export interface UseMultiOptions<
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString
> {
  terms: ViewTermsByCollectionName[CollectionName],
  extraVariablesValues?: any,
  pollInterval?: number,
  enableTotal?: boolean,
  enableCache?: boolean,
  extraVariables?: any,
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
  const { history } = useNavigation();

  const locationQueryLimit = locationQuery && queryLimitName && !isNaN(parseInt(locationQuery[queryLimitName])) ? parseInt(locationQuery[queryLimitName]) : undefined;
  const termsLimit = terms?.limit; // FIXME despite the type definition, terms can actually be undefined
  const defaultLimit: number = locationQueryLimit ?? termsLimit ?? initialLimit

  const [ limit, setLimit ] = useState(defaultLimit);
  const [ lastTerms, setLastTerms ] = useState(_.clone(terms));
  
  const collection = getCollection(collectionName);
  const fragment = getFragment(fragmentName);
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraVariables });
  const resolverName = collection.options.multiResolverName;

  const graphQLVariables = {
    input: {
      terms: { ...terms, limit: defaultLimit },
      enableCache, enableTotal, createIfMissing, fragmentName
    },
    ...(_.pick(extraVariablesValues, Object.keys(extraVariables || {})))
  }
  
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
    ssr: ssr || !isServer,
    skip,
    notifyOnNetworkStatusChange: true
  }
  const {data, error, loading, refetch, fetchMore, networkStatus} = useQuery(query, useQueryArgument);

  const client = useApolloClient();
  const invalidateCache = () => invalidateQuery({
    client,
    query,
    variables: graphQLVariables,
  });

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
      history.push({...location, search: `?${qs.stringify(newQuery)}`})
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
    loadMore, count, totalCount, loading,
    hidden: !showLoadMore,
  };
  
  let results = data?.[resolverName]?.results;
  if (results && results.length > limit) {
    results = _.take(results, limit);
  }
  
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
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
