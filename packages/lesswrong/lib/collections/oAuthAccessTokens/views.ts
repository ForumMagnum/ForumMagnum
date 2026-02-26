import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface OAuthAccessTokensViewTerms extends ViewTermsBase {
    view: OAuthAccessTokensViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const OAuthAccessTokensViews = new CollectionViewSet('OAuthAccessTokens', {
  // Add your view functions here
});
