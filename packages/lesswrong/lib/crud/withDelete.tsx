/*

Generic mutation wrapper to remove a document from a collection.

Sample mutation:

  mutation deleteMovie($input: DeleteMovieInput) {
    deleteMovie(input: $input) {
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
    - input.selector: the id of the document to remove

Child Props:

  - deleteMovie({ selector })

*/

import React from 'react';
import gql from 'graphql-tag';
import { deleteClientTemplate, extractCollectionInfo, extractFragmentInfo } from '../vulcan-lib';
import { compose, withHandlers } from 'recompose';
import { updateCacheAfterDelete } from './cacheUpdates';
import { getExtraVariables } from './utils'
import { Mutation } from '@apollo/client/react/components';

export const withDelete = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${deleteClientTemplate({ typeName, fragmentName })}
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
      [`delete${typeName}`]: ({ mutate, ownProps }) => ({ selector }) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { selector, ...extraVariables },
          update: updateCacheAfterDelete(typeName)
        });
      },
    })
  )
};

export default withDelete;
