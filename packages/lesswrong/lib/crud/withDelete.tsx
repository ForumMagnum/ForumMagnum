import React from 'react';
import { extractCollectionInfo, extractFragmentInfo } from '../vulcan-lib';
import { compose, withHandlers } from 'recompose';
import { updateCacheAfterDelete } from './cacheUpdates';
import { getExtraVariables } from './utils'
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import type { MutationResult } from '@apollo/client/react';

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
 * Higher-order-component wrapper that adds a prop deleteFoo to the wrapped
 * component, which can be called to delete an entry in the chosen collection.
 * This should mostly never be used; firstly, because we strongly prefer to do
 * soft deletes (ie, setting a 'deleted' flag on the object to true), and also
 * because this is an HoC and we now strongly prefer hooks.
 *
 * (Unlike the other CRUD operations, this one doesn't have a hookified version
 * written yet, because it shouldn't be used).
 */
export const withDelete = (options: any) => {
  const { collectionName, collection } = extractCollectionInfo(options);
  const { fragmentName, fragment } = extractFragmentInfo(options, collectionName);

  const typeName = collection.options.typeName;
  const query = gql`
    ${deleteClientTemplate({ typeName, fragmentName })}
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

  // wrap component with graphql HoC
  return compose(
    mutationWrapper,
    withHandlers({
      [`delete${typeName}`]: ({ mutate, ownProps }) => ({selector}: {selector: any}) => {
        const extraVariables = getExtraVariables(ownProps, options.extraVariables)
        return mutate({
          variables: { selector, ...extraVariables },
          update: updateCacheAfterDelete(typeName)
        });
      },
    })
  )
};
