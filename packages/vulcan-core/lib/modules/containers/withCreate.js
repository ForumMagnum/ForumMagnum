/*

Generic mutation wrapper to insert a new document in a collection and update
a related query on the client with the new item and a new total item count.

Sample mutation:

  mutation createMovie($data: CreateMovieData) {
    createMovie(data: $data) {
      data {
        _id
        name
        __typename
      }
      __typename
    }
  }

Arguments:

  - data: the document to insert

Child Props:

  - createMovie({ data })

*/

import React, { Component } from 'react';
import { graphql, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { createClientTemplate } from 'meteor/vulcan:core';
import { extractCollectionInfo, extractFragmentInfo } from 'meteor/vulcan:lib';
import { compose, withHandlers } from 'recompose';
import { cacheUpdateGenerator } from './cacheUpdates';
import { getExtraVariables } from './utils'

const withCreate = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment, extraVariablesString } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${createClientTemplate({ typeName, fragmentName, extraVariablesString })}
    ${fragment}
  `;

  const mutationWrapper = (Component) => (props) => (
    <Mutation mutation={query}>
      {(mutate, { data }) => (
        <Component
          {...props}
          mutate={mutate}
          ownProps={props}
        />
      )}
    </Mutation>
  )

  // wrap component with graphql HoC
  return compose(
    mutationWrapper,
    withHandlers({
      [`create${typeName}`]: ({ mutate, ownProps }) => ({ data }) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { data, ...extraVariables },
          update: cacheUpdateGenerator(typeName, 'create')
        });
      },
    })
  )
};

export default withCreate;
