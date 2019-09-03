/*

### withMulti

Paginated items container

Options:

  - collection: the collection to fetch the documents from
  - fragment: the fragment that defines which properties to fetch
  - fragmentName: the name of the fragment, passed to getFragment
  - limit: the number of documents to show initially
  - pollInterval: how often the data should be updated, in ms (set to 0 to disable polling)
  - terms: an object that defines which documents to fetch

Props Received:

  - terms: an object that defines which documents to fetch

Terms object can have the following properties:

  - view: String
  - userId: String
  - cat: String
  - date: String
  - after: String
  - before: String
  - enableTotal: Boolean
  - enableCache: Boolean
  - listId: String
  - query: String # search query
  - postId: String
  - limit: String

*/

import { useState } from 'react';
import { graphql, useQuery } from 'react-apollo';
import gql from 'graphql-tag';
import {
  getSetting,
  Utils,
  multiClientTemplate,
  extractCollectionInfo,
  extractFragmentInfo,
} from 'meteor/vulcan:lib';
import compose from 'recompose/compose';
import withState from 'recompose/withState';

function getGraphQLQueryFromOptions({
  collectionName, collection, fragmentName, fragment, extraQueries, extraVariables,
}) {
  const typeName = collection.options.typeName;
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  
  // build graphql query from options
  return gql`
    ${multiClientTemplate({ typeName, fragmentName, extraQueries, extraVariablesString })}
    ${fragment}
  `;
}

export default function withMulti({
  limit = 10,
  pollInterval = getSetting('pollInterval', 0), //LESSWRONG: Polling defaults disabled
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraQueries,
  ssr = false, //LESSWRONG: SSR defaults false
  extraVariables,
  fetchPolicy,
  notifyOnNetworkStatusChange,
  propertyName = "results",
  collectionName, collection,
  fragmentName, fragment,
  terms: queryTerms,
}) {
  // if this is the SSR process, set pollInterval to null
  // see https://github.com/apollographql/apollo-client/issues/1704#issuecomment-322995855
  //pollInterval = typeof window === 'undefined' ? null : pollInterval;

  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  const typeName = collection.options.typeName;
  const resolverName = collection.options.multiResolverName;
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraQueries, extraVariables });

  return compose(
    // wrap component with HoC that manages the terms object via its state
    withState('paginationTerms', 'setPaginationTerms', props => {
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
        alias: `with${Utils.pluralize(typeName)}`,

        // graphql query options
        options({ terms, paginationTerms, currentUser, ...rest }) {
          // get terms from options, then props, then pagination
          const mergedTerms = { ...queryTerms, ...terms, ...paginationTerms };
          const graphQLOptions = {
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
            ssr,
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
        props(props) {
          // see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
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
            // eslint-disable-next-line no-console
            console.log(error);
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
            loadMore(providedTerms) {
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

export function useMulti({
  terms,
  extraVariablesValues,
  
  pollInterval = getSetting('pollInterval', 0), //LESSWRONG: Polling defaults disabled
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraQueries,
  ssr = false, //LESSWRONG: SSR defaults false
  extraVariables,
  fetchPolicy,
  collectionName, collection,
  fragmentName, fragment,
  limit:initialLimit = 10,
  itemsPerPage = 10,
}) {
  const [ limit, setLimit ] = useState(initialLimit);
  const [ hasRequestedMore, setHasRequestedMore ] = useState(false);
  
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraQueries, extraVariables });
  const resolverName = collection.options.multiResolverName;
  
  const {data, error, loading, refetch} = useQuery(query, {
    variables: {
      input: {
        terms: { ...terms, limit: limit },
        enableCache, enableTotal,
      },
      ...(_.pick(extraVariablesValues, Object.keys(extraVariables || {})))
    },
    pollInterval,
    fetchPolicy,
    ssr
  });
  
  return {
    loading,
    loadingInitial: loading && !hasRequestedMore,
    loadingMore: loading && hasRequestedMore,
    results: data && data[resolverName] && data[resolverName].results,
    totalCount: data && data[resolverName] && data[resolverName].totalCount,
    refetch,
    error,
    count: data && data.results && data.results.length,
    loadMore: () => {
      setHasRequestedMore(true);
      setLimit(limit+itemsPerPage);
    },
    limit,
  };
}
