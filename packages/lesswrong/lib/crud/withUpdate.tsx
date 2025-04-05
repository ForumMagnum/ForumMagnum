import { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import type { ApolloError } from '@apollo/client';
import { extractFragmentInfo } from '../vulcan-lib/handleOptions';
import { collectionNameToTypeName } from '../generated/collectionTypeNames';
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
`mutation update${typeName}($selector: SelectorInput!, $data: Update${typeName}DataInput!, ${extraVariablesString || ''}) {
  update${typeName}(selector: $selector, data: $data) {
    data {
      ...${fragmentName}
    }
  }
}`;

type FragmentOrFragmentName<F extends FragmentName = FragmentName> =
   {fragment: any, fragmentName?: never}
  |{fragment?: never, fragmentName: F}

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
export const useUpdate = <CollectionName extends CollectionNameString, F extends FragmentName = FragmentName>(options: FragmentOrFragmentName<F> & {
  collectionName: CollectionName,
  skipCacheUpdate?: boolean,
}): {
  /** Set a field to `null` to delete it */
  mutate: WithUpdateFunction<CollectionName, F>,
  loading: boolean,
  error: ApolloError|undefined,
  called: boolean,
  data: ObjectsByCollectionName[CollectionName],
}=> {
  const {fragmentName, fragment} = extractFragmentInfo({fragmentName: options.fragmentName, fragment: options.fragment}, options.collectionName);

  const typeName = collectionNameToTypeName[options.collectionName];
  const query = gql`
    ${updateClientTemplate({ typeName, fragmentName })}
    ${fragment}
  `;

  const [mutate, {loading, error, called, data}] = useMutation(query);
  const wrappedMutate = useCallback(({selector, data, optimisticResponse, ...extraVariables}: {
    selector: MongoSelector<ObjectsByCollectionName[CollectionName]>,
    data: NullablePartial<ObjectsByCollectionName[CollectionName]>,
    optimisticResponse?: FragmentTypes[F],
    extraVariables?: any,
  }) => {
    const optimisticMutationResponse = optimisticResponse
      ? {
        optimisticResponse: {
          [`update${typeName}`]: {
            __typename: `update${typeName}`,
            data: {
              __typename: typeName,
              ...optimisticResponse,  
            }
          }
        }
      }
      : {};

    return mutate({
      variables: { selector, data, ...extraVariables },
      update: options.skipCacheUpdate ? undefined : updateCacheAfterUpdate(typeName),
      ...optimisticMutationResponse
    });
  }, [mutate, typeName, options.skipCacheUpdate]);
  return {mutate: wrappedMutate, loading, error, called, data};
}
