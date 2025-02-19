import { ApolloError, gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react/hooks';
import { extractFragmentInfo, collectionNameToTypeName } from '../vulcan-lib';
import { updateCacheAfterCreate } from './cacheUpdates';
import { loggerConstructor } from '../utils/logging';
import { useCallback, useMemo } from 'react';

/**
 * Create mutation query used on the client. Eg:
 *
 * mutation createMovie($data: CreateMovieDataInput!) {
 *   createMovie(data: $data) {
 *     data {
 *       _id
 *       name
 *       __typename
 *     }
 *     __typename
 *   }
 * }
 */
const createClientTemplate = ({ typeName, fragmentName, extraVariablesString }: {
  typeName: string,
  fragmentName: string,
  extraVariablesString?: string,
}) => (
`mutation create${typeName}($data: Create${typeName}DataInput!, ${extraVariablesString || ''}) {
  create${typeName}(data: $data) {
    data {
      ...${fragmentName}
    }
  }
}`
);

/**
 * Hook that returns a function for creating a new object in a collection, along
 * with some metadata about the status of that create operation if it's been
 * started.
 */
export const useCreate = <CollectionName extends CollectionNameString>({
  collectionName,
  fragmentName: fragmentNameArg, fragment: fragmentArg,
  ignoreResults=false,
}: {
  collectionName: CollectionName,
  fragmentName?: FragmentName,
  fragment?: any,
  ignoreResults?: boolean,
}): {
  create: WithCreateFunction<CollectionName>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data?: ObjectsByCollectionName[CollectionName],
} => {
  const logger = useMemo(() => {
    return loggerConstructor(`mutations-${collectionName.toLowerCase()}`);
  }, [collectionName]);
  const { fragmentName, fragment } = extractFragmentInfo({fragmentName: fragmentNameArg, fragment: fragmentArg}, collectionName);

  const typeName = collectionNameToTypeName(collectionName);
  
  const query = gql`
    ${createClientTemplate({ typeName, fragmentName })}
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
