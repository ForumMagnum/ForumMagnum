import React, { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import type { MutationResult } from '@apollo/client/react';
import type { ApolloError } from '@apollo/client';
import { compose, withHandlers } from 'recompose';
import { getCollection, extractFragmentInfo } from '../vulcan-lib';
import { getExtraVariables } from './utils';
import { updateCacheAfterUpdate } from './cacheUpdates';

// Update mutation query used on the client
//
// mutation updateMovie($selector: MovieSelectorUniqueInput!, $data: UpdateMovieDataInput!) {
//   updateMovie(selector: $selector, data: $data) {
//     data {
//       _id
//       name
//       __typename
//     }
//     __typename
//   }
// }
const updateClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: string,
  extraVariablesString?: string,
}) =>
`mutation update${typeName}($selector: ${typeName}SelectorUniqueInput!, $data: Update${typeName}DataInput!, ${extraVariablesString || ''}) {
  update${typeName}(selector: $selector, data: $data) {
    data {
      ...${fragmentName}
    }
  }
}`;

/**
 * HoC that adds a function for mutating objects. DEPRECATED: You want to use
 * the hook version of this, useUpdate, instead.
 */
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

  const mutationWrapper = (Component: any) => (props: any) => (
    <Mutation mutation={query}>
      {(mutate: any, mutationResult: MutationResult<any>) => (
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
      [`update${typeName}`]: ({ mutate, ownProps }: any) => ({ selector, data }: any) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { selector, data, ...extraVariables },
          update: updateCacheAfterUpdate(typeName)
        });
      },
    })
  )
};

type FragmentOrFragmentName =
   {fragment: any, fragmentName?: never}
  |{fragment?: never, fragmentName: FragmentName}

/**
 * HoC that returns a function which updates an object, given its ID and some
 * fields to change. A typical usage would look like:
 *
 *   const { mutate: updatePost } = useUpdate({
 *     collectionName: "Posts",
 *     fragmentName: "PostsList",
 *   });
 *   const onClickSomeButton = () => {
 *     updatePost({
 *       selector: {_id: postId},
 *       data: {
 *         someButtonWasClicked: true,
 *       },
 *     })
 *   }
 *
 * When the document is edited, the edited version is refetched as a reply to
 * the update mutation, with the provided fragment, and merged into
 * the client-side cache; the selected fragment should have fields that are a
 * superset of fields used in the queries that you want to be updated.
 */
export const useUpdate = <CollectionName extends CollectionNameString>(options: FragmentOrFragmentName & {
  collectionName: CollectionName,
  skipCacheUpdate?: boolean,
}): {
  /** Set a field to `null` to delete it */
  mutate: WithUpdateFunction<CollectionBase<ObjectsByCollectionName[CollectionName]>>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data: ObjectsByCollectionName[CollectionName],
}=> {
  const collection = getCollection(options.collectionName);
  const {fragmentName, fragment} = extractFragmentInfo({fragmentName: options.fragmentName, fragment: options.fragment}, options.collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const [mutate, {loading, error, called, data}] = useMutation(query);
  const wrappedMutate = useCallback(({selector, data, ...extraVariables}: {
    selector: MongoSelector<ObjectsByCollectionName[CollectionName]>,
    data: Partial<ObjectsByCollectionName[CollectionName]>,
    extraVariables?: any,
  }) => {
    return mutate({
      variables: { selector, data, ...extraVariables },
      update: options.skipCacheUpdate ? undefined : updateCacheAfterUpdate(typeName)
    })
  }, [mutate, typeName]);
  return {mutate: wrappedMutate, loading, error, called, data};
}
