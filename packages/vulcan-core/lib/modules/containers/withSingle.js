import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql, useQuery } from 'react-apollo';
import gql from 'graphql-tag';
import { getSetting, singleClientTemplate, Utils, extractCollectionInfo, extractFragmentInfo } from 'meteor/vulcan:lib';

export function getGraphQLQueryFromOptions(options) {
  const { extraQueries } = options;
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);
  const typeName = collection.options.typeName;

  // LESSWRONG MODIFICATION: Allow the passing of extraVariables so that you can have field-specific queries
  let extraVariablesString = ''
  if (options.extraVariables) {
    extraVariablesString = Object.keys(options.extraVariables).map(k => `$${k}: ${options.extraVariables[k]}`).join(', ')
  }
  
  const query = gql`
    ${singleClientTemplate({ typeName, fragmentName, extraQueries, extraVariablesString })}
    ${fragment}
  `;
  
  return query
}

export function getResolverNameFromOptions(options) {
  const { collection } = extractCollectionInfo(options);
  const typeName = collection.options.typeName;
  return Utils.camelCaseify(typeName);
}

export default function withSingle(options) {
  const query = getGraphQLQueryFromOptions(options)
  const resolverName = getResolverNameFromOptions(options)
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);
  const typeName = collection.options.typeName;
  
  return graphql(query, {
    alias: `with${typeName}`,

    options({ documentId, slug, selector = { documentId, slug }, ...rest }) {
      // OpenCrud backwards compatibility
      // From the provided arguments, pick the key-value pairs where the key is also in extraVariables option
      const extraVariables = _.pick(rest, Object.keys(options.extraVariables || {}))  
      const graphQLOptions = {
        variables: {
          input: {
            selector,
          },
          ...extraVariables
        }
      };

      if (options.fetchPolicy) {
        graphQLOptions.fetchPolicy = options.fetchPolicy;
      }

      return graphQLOptions;
    },
    props: returnedProps => {
      const { /* ownProps, */ data } = returnedProps;

      const propertyName = options.propertyName || 'document';
      const props = {
        loading: data.loading,
        refetch: data.refetch,
        // document: Utils.convertDates(collection, data[singleResolverName]),
        [propertyName]: data[resolverName] && data[resolverName].result,
        fragmentName,
        fragment,
        data
      };

      if (data.error) {
        // get graphQL error (see https://github.com/thebigredgeek/apollo-errors/issues/12)
        props.error = data.error.graphQLErrors[0];
      }

      return props;
    }
  });
}

export function useSingle(options, documentId, extraVariables) {
  let { fetchPolicy } = options;
  const query = getGraphQLQueryFromOptions(options)
  const resolverName = getResolverNameFromOptions(options)
  const { data, ...rest } = useQuery(query, { 
    variables: { input: { selector: { documentId } }, ...extraVariables }, 
    fetchPolicy 
  })
  const document = data && data[resolverName] && data[resolverName].result
  return { document, data, ...rest }
}
