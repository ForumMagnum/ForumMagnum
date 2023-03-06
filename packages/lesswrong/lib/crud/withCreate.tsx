import React from 'react';
import { ApolloError, gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { useApolloClient, useMutation } from '@apollo/client/react/hooks';
import type { MutationResult } from '@apollo/client/react';
import { withApollo } from '@apollo/client/react/hoc';
import { extractCollectionInfo, extractFragmentInfo, getCollection } from '../vulcan-lib';
import { compose, withHandlers } from 'recompose';
import { updateCacheAfterCreate } from './cacheUpdates';
import { getExtraVariables } from './utils'
import { loggerConstructor } from '../utils/logging';

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
 * Generic mutation wrapper to insert a new document in a collection and update
 * a related query on the client with the new item and a new total item count.
 *
 * Arguments:
 *  - data: the document to insert
 * Child Props:
 *  - createMovie({ data })
 */
export const withCreate = options => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${createClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const mutationWrapper = (Component) => (props) => (
    <Mutation mutation={query}>
      {(mutate, result: MutationResult<any>) => (
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
    withApollo,
    withHandlers({
      [`create${typeName}`]: ({ mutate, ownProps }) => ({ data }) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { data, ...extraVariables },
          update: updateCacheAfterCreate(typeName, ownProps.client)
        });
      },
    })
  )
};

export default withCreate;

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
  create: WithCreateFunction<CollectionBase<ObjectsByCollectionName[CollectionName]>>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data?: ObjectsByCollectionName[CollectionName],
} => {
  const collection = getCollection(collectionName);
  const logger = loggerConstructor(`mutations-${collectionName.toLowerCase()}`)
  const { fragmentName, fragment } = extractFragmentInfo({fragmentName: fragmentNameArg, fragment: fragmentArg}, collectionName);

  const typeName = collection!.options.typeName;
  
  const query = gql`
    ${createClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;
  
  const client = useApolloClient();
  
  const [mutate, {loading, error, called, data}] = useMutation(query, {
    ignoreResults: ignoreResults
  });
  const wrappedCreate = ({ data }) => {
    logger('useCreate, wrappedCreate()')
    return mutate({
      variables: { data },
      update: updateCacheAfterCreate(typeName, client)
    })
  }
  return {create: wrappedCreate, loading, error, called, data};
}
