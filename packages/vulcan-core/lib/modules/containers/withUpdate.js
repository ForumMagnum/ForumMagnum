/*

Generic mutation wrapper to update a document in a collection.

Sample mutation:

  mutation updateMovie($input: UpdateMovieInput) {
    updateMovie(input: $input) {
      data {
        _id
        name
        __typename
      }
      __typename
    }
  }

Arguments:

  - input
    - input.selector: a selector to indicate the document to update
    - input.data: the document (set a field to `null` to delete it)

Child Props:

  - updateMovie({ selector, data })

*/

import React from 'react';
import { Mutation } from 'react-apollo';
import { compose, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { updateClientTemplate, extractCollectionInfo, extractFragmentInfo } from 'meteor/vulcan:lib';
import { getExtraVariables } from './utils';
import { cacheUpdateGenerator } from './cacheUpdates';

const withUpdate = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment, extraVariablesString } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName, extraVariablesString })}
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

  return compose(
    mutationWrapper,
    withHandlers({
      [`update${typeName}`]: ({ mutate, ownProps }) => ({ selector, data }) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { selector, data, ...extraVariables },
          update: cacheUpdateGenerator(typeName, 'update')
        });
      },
    })
  )
};

export default withUpdate;
