import { useCallback } from 'react';
import { updateCacheAfterDelete } from './cacheUpdates';
import { useMutation, gql } from '@apollo/client';
import type { ApolloError } from '@apollo/client';
import { extractFragmentInfo } from "../vulcan-lib/handleOptions";
import { collectionNameToTypeName } from "../generated/collectionTypeNames";
import { getDeleteMutationName } from './utils';

/**
 * Hook that returns a function for a delete operation. This should mostly never
 * be used, because we strongly prefer to do soft deletes (ie, setting a
 * 'deleted' flag on the object to true).
 */
export const useDelete = <CollectionName extends CollectionNameString>(options: {
  collectionName: CollectionName,
  fragmentName?: FragmentName,
  fragment?: any,
}): {
  deleteDocument: (props: {selector: any}) => Promise<any>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data: ObjectsByCollectionName[CollectionName],
} => {
  const typeName = collectionNameToTypeName[options.collectionName];
  const {fragmentName, fragment} = extractFragmentInfo({fragmentName: options.fragmentName, fragment: options.fragment}, options.collectionName);
  const mutationName = getDeleteMutationName(typeName);

  const query = gql`
    mutation delete${typeName}($selector: ${typeName}SelectorUniqueInput!) {
      ${mutationName}(selector: $selector) {
        data {
          ...${fragmentName}
        }
      }
    }
    ${fragment}
  `;

  const [mutate, {loading, error, called, data}] = useMutation(query);
  const wrappedDelete = useCallback(({selector, extraVariables}: {
    selector: MongoSelector<ObjectsByCollectionName[CollectionName]>,
    data: Partial<ObjectsByCollectionName[CollectionName]>,
    extraVariables?: any,
  }) => {
    return mutate({
      variables: { selector, ...extraVariables },
      update: updateCacheAfterDelete(typeName)
    })
  }, [mutate, typeName]);
  return {deleteDocument: wrappedDelete, loading, error, called, data};
}
