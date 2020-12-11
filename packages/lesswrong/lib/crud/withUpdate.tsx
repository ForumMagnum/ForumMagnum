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
import type { ApolloError } from '@apollo/client';
import { compose, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { updateClientTemplate, getCollection, getFragment, extractFragmentInfo } from '../vulcan-lib';
import { getExtraVariables } from './utils';
import { updateCacheAfterUpdate } from './cacheUpdates';

export const withUpdate = (options: {
  collectionName: CollectionNameString,
  fragmentName?: FragmentName,
  fragment?: any,
  extraVariables?: any, //TODO: Unused?
}) => {
  const collection = getCollection(options.collectionName);
  const {fragmentName, fragment} = extractFragmentInfo({fragmentName: options.fragmentName, fragment: options.fragment}, options.collectionName);

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
          update: updateCacheAfterUpdate(typeName)
        });
      },
    })
  )
};

export default withUpdate;

export const useUpdate = <CollectionName extends CollectionNameString>({ collectionName, fragmentName }: {
  collectionName: CollectionName,
  fragmentName: FragmentName,
}): {
  mutate: WithUpdateFunction<CollectionBase<ObjectsByCollectionName[CollectionName]>>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data: ObjectsByCollectionName[CollectionName],
}=> {
  const collection = getCollection(collectionName);
  const fragment = getFragment(fragmentName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const [mutate, {loading, error, called, data}] = useMutation(query);
  const wrappedMutate = ({selector, data, ...extraVariables}: {
    selector: MongoSelector<ObjectsByCollectionName[CollectionName]>,
    data: Partial<ObjectsByCollectionName[CollectionName]>,
    extraVariables?: any,
  }) => {
    return mutate({
      variables: { selector, data, ...extraVariables },
      update: updateCacheAfterUpdate(typeName)
    })
  }
  return {mutate: wrappedMutate, loading, error, called, data};
}
