import LRU from 'lru-cache';

// This cache helps avoid multiple network load times when requesting
// tokens in quick succession.
// CkEditor tokens are valid for 24 hours, so we use a 12 hour TTL.
const cache = new LRU<string, string>({
  maxAge: 1000 * 60 * 60 * 12
});

export const getCKEditorDocumentId = (documentId: string|undefined, userId: string|undefined, formType: string|undefined) => {
  if (documentId) return `${documentId}-${formType}`
  return `${userId}-${formType}`
}

export function generateTokenRequest(collectionName: CollectionNameString, fieldName: string, documentId?: string, userId?: string, formType?: string, linkSharingKey?: string) {
  return () => {
    const cacheKey = `${collectionName}-${fieldName}-${documentId}-${userId}-${formType}-${linkSharingKey}`;
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
