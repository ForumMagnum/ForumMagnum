import { useCallback } from 'react';
import { extractFragmentInfo, collectionNameToTypeName } from '../vulcan-lib';
import { updateCacheAfterDelete } from './cacheUpdates';
import { useMutation, gql } from '@apollo/client';
import type { ApolloError } from '@apollo/client';

// Delete mutation query used on the client. Eg:
//
// mutation deleteMovie($selector: MovieSelectorUniqueInput!) {
//   deleteMovie(selector: $selector) {
//     data {
//       _id
//       name
//       __typename
//     }
//     __typename
//   }
// }
const deleteClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: string,
  extraVariablesString?: string,
}) =>
`mutation delete${typeName}($selector: ${typeName}SelectorUniqueInput!, ${extraVariablesString || ''}) {
  delete${typeName}(selector: $selector) {
    data {
      ...${fragmentName}
    }
  }
}`;

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
  const typeName = collectionNameToTypeName(options.collectionName);
  const {fragmentName, fragment} = extractFragmentInfo({fragmentName: options.fragmentName, fragment: options.fragment}, options.collectionName);

  const query = gql`
    ${deleteClientTemplate({ typeName, fragmentName })}
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
