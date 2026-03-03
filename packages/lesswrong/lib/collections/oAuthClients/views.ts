import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface OAuthClientsViewTerms extends ViewTermsBase {
    view: OAuthClientsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const OAuthClientsViews = new CollectionViewSet('OAuthClients', {
  // Add your view functions here
});
