import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { getFragment, getFragmentName, getSetting } from 'meteor/vulcan:core';
import compose from 'recompose/compose';
import withIdle from './withIdle.jsx';
import withIdlePollingStopper from './withIdlePollingStopper';

export default function withDocument (options) {

  const { collection, pollInterval = getSetting('pollInterval', 20000), enableCache = false, stopPollingIdleStatus = "INACTIVE", extraQueries } = options,
        queryName = options.queryName || `${collection.options.collectionName}SingleQuery`,
        singleResolverName = collection.options.resolvers.single && collection.options.resolvers.single.name;

  let fragment;

  if (options.fragment) {
    fragment = options.fragment;
  } else if (options.fragmentName) {
    fragment = getFragment(options.fragmentName);
  } else {
    fragment = getFragment(`${collection.options.collectionName}DefaultFragment`);
  }

  const fragmentName = getFragmentName(fragment);

  return compose(
    // wrap component with withIdle to get access to idle state
    withIdle,

    graphql(gql`
      query ${queryName}($documentId: String, $slug: String, $enableCache: Boolean) {
        ${singleResolverName}(documentId: $documentId, slug: $slug, enableCache: $enableCache) {
          __typename
          ...${fragmentName}
        }
        ${extraQueries || ''}
      }
      ${fragment}
    `, {
      alias: 'withDocument',

      options(ownProps) {
        const graphQLOptions = {
          variables: { documentId: ownProps.documentId, slug: ownProps.slug },
          pollInterval, // note: pollInterval can be set to 0 to disable polling (20s by default)
        };

        if (options.fetchPolicy) {
          graphQLOptions.fetchPolicy = options.fetchPolicy;
        }

        return graphQLOptions;
      },
      props: returnedProps => {
        const { ownProps, data } = returnedProps;
        const propertyName = options.propertyName || 'document';
        const props = {
          startPolling: data.startPolling,
          stopPolling: data.stopPolling,
          loading: data.loading,
          // document: Utils.convertDates(collection, data[singleResolverName]),
          [ propertyName ]: data[singleResolverName],
          fragmentName,
          fragment,
          data,
        };
        if (data.error) {
          // get graphQL error (see https://github.com/thebigredgeek/apollo-errors/issues/12)
          props.error = data.error.graphQLErrors[0];
        }
        return props;
      },
    }),
    withIdlePollingStopper(stopPollingIdleStatus)
)
}
