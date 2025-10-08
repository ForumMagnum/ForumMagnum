import { useCurrentUserId } from '@/components/common/withUser';
import { useApolloClient } from '@apollo/client/react';
import LRU from 'lru-cache';
import { gql } from './generated/gql-codegen';

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

export const getCKEditorDocumentId = (documentId: string|undefined, userId: string|undefined, formType: string|undefined) => {
  if (documentId) return `${documentId}-${formType}`
  return `${userId}-${formType}`
}

export function generateTokenRequest(collectionName: CollectionNameString, fieldName: string, documentId?: string, userId?: string, formType?: string, linkSharingKey?: string) {
  return () => {
    const cacheKey = getTokenCacheKey({collectionName, fieldName, documentId, userId, formType, linkSharingKey});
    const cachedToken = cache.get(cacheKey);
    if (cachedToken) {
      return Promise.resolve(cachedToken);
    }
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open( 'GET', '/ckeditor-token' );
  
      xhr.addEventListener('load', () => {
        const statusCode = xhr.status;
        const xhrResponse = xhr.response;

        if (statusCode < 200 || statusCode > 299) {
          return reject(new Error('Cannot download a new token!'));
        }

        cache.set(cacheKey, xhrResponse);

        return resolve( xhrResponse );
      });
  
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Abort')));
  
      xhr.setRequestHeader('collection-name', collectionName);
      xhr.setRequestHeader('field-name', fieldName);
      if (linkSharingKey) {
        xhr.setRequestHeader('link-sharing-key', linkSharingKey);
      }

      if (documentId) xhr.setRequestHeader('document-id', documentId);
      if (userId) xhr.setRequestHeader('user-id', userId);
      if (formType) xhr.setRequestHeader('form-type', formType);

      xhr.send();
    });
  }
}

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
    return null;
  }
  
  return { getCkEditorToken };
}
