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

// Generic mutation wrapper to remove a document from a collection.
//
// Arguments:
//   - input
//     - input.selector: the id of the document to remove
// Child Props:
//   - deleteMovie({ selector })
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
      {(mutate, mutationResult: MutationResult<any>) => (
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
