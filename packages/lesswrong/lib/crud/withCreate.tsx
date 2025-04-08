import { ApolloError, gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react/hooks';
import { updateCacheAfterCreate } from './cacheUpdates';
import { loggerConstructor } from '../utils/logging';
import { useCallback, useMemo } from 'react';
import { extractFragmentInfo } from "../vulcan-lib/handleOptions";
import { collectionNameToTypeName } from "../generated/collectionTypeNames";
import { getCreateMutationName } from './utils';

/**
 * Hook that returns a function for creating a new object in a collection, along
 * with some metadata about the status of that create operation if it's been
 * started.
 */
export const useCreate = <CollectionName extends CollectionNameString, Fragment extends FragmentName>({
  collectionName,
  fragmentName: fragmentNameArg, fragment: fragmentArg,
  ignoreResults=false,
}: {
  collectionName: CollectionName,
  fragmentName?: Fragment,
  fragment?: any,
  ignoreResults?: boolean,
}): {
  create: WithCreateFunction<CollectionName>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data?: FragmentTypes[Fragment],
} => {
  const logger = useMemo(() => {
    return loggerConstructor(`mutations-${collectionName.toLowerCase()}`);
  }, [collectionName]);
  const { fragmentName, fragment } = extractFragmentInfo({fragmentName: fragmentNameArg, fragment: fragmentArg}, collectionName);

  const typeName = collectionNameToTypeName[collectionName];
  const mutationName = getCreateMutationName(typeName);
  
  const query = gql`
    mutation create${typeName}($data: Create${typeName}DataInput!) {
      ${mutationName}(data: $data) {
        data {
          ...${fragmentName}
        }
      }
    }
    ${fragment}
  `;
  
  const client = useApolloClient();
  
  const [mutate, {loading, error, called, data}] = useMutation(query, {
    ignoreResults: ignoreResults
  });
  const wrappedCreate = useCallback(({data}: {
    data: NullablePartial<ObjectsByCollectionName[CollectionName]>,
  }) => {
    logger('useCreate, wrappedCreate()')
    return mutate({
      variables: { data },
      update: updateCacheAfterCreate(typeName, client)
    })
  }, [logger, mutate, typeName, client]);
  return {create: wrappedCreate, loading, error, called, data};
}
