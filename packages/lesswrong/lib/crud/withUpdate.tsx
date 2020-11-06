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
import { useMutation } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { compose, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { updateClientTemplate, extractCollectionInfo, extractFragmentInfo } from '../vulcan-lib';
import { getExtraVariables } from './utils';
import { cacheUpdateGenerator } from './cacheUpdates';

export const withUpdate = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
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

export const useUpdate = <T extends DbObject>({
  collectionName, collection,
  fragmentName: fragmentNameArg, fragment: fragmentArg,
}: {
  collectionName?: CollectionNameString,
  collection?: CollectionBase<T>,
  fragmentName?: string,
  fragment?: any,
}) => {
  ({ collectionName, collection } = extractCollectionInfo({collectionName, collection}));
  const { fragmentName, fragment } = extractFragmentInfo({fragmentName: fragmentNameArg, fragment: fragmentArg}, collectionName);

  const typeName = collection!.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const [mutate, {loading, error, called, data}] = useMutation(query);
  const wrappedMutate = ({selector, data, ...extraVariables}) => {
    return mutate({
      variables: { selector, data, ...extraVariables },
      update: cacheUpdateGenerator(typeName, 'update')
    })
  }
  return {mutate: wrappedMutate, loading, error, called, data};
}
