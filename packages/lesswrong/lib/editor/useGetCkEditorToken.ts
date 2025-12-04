import { useCurrentUserId } from '@/components/common/withUser';
import { useApolloClient } from '@apollo/client/react';
import LRU from 'lru-cache';
import { gql } from '@/lib/generated/gql-codegen';

const getCkEditorTokenQuery = gql(`
  query getCkEditorToken($options: GetCkEditorTokenOptions!) {
    getCkEditorToken(options: $options)
  }
`);

export const useGetCkEditorToken = () => {
  const client = useApolloClient();
  const currentUserId = useCurrentUserId();

  const getCkEditorToken = async ({collectionName, fieldName, documentId, formType, key}: {
    collectionName: CollectionNameString,
    fieldName: string,
    documentId: string|undefined,
    formType: "new"|"edit",
    key: string|null
  }): Promise<string|null> => {
    const cacheKey = getTokenCacheKey({collectionName, fieldName, documentId, userId: currentUserId, formType, linkSharingKey: key ?? undefined});
    const cachedToken = cache.get(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }
    const response = await client.query({
      query: getCkEditorTokenQuery,
      variables: {
        options: {
          collectionName, fieldName, documentId, formType, linkSharingKey: key
        }
      },
    });
    const token = response.data?.getCkEditorToken ?? null;
    console.log(`getCkEditorToken returning ${token}`);
    return token;
  }
  
  return { getCkEditorToken };
}

// This cache helps avoid multiple network load times when requesting
// tokens in quick succession.
// CkEditor tokens are valid for 24 hours, so we use a 12 hour TTL.
const cache = new LRU<string, string>({
  maxAge: 1000 * 60 * 60 * 12
});

const getTokenCacheKey = ({ collectionName, fieldName, documentId, userId, formType, linkSharingKey }: {
  collectionName: CollectionNameString,
  fieldName: string,
  documentId?: string,
  userId?: string,
  formType?: string,
  linkSharingKey?: string
}) => {
  return `${collectionName}-${fieldName}-${documentId}-${userId}-${formType}-${linkSharingKey}`;
}
