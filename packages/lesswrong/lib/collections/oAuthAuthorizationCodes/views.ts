import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface OAuthAuthorizationCodesViewTerms extends ViewTermsBase {
    view: OAuthAuthorizationCodesViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const OAuthAuthorizationCodesViews = new CollectionViewSet('OAuthAuthorizationCodes', {
  // Add your view functions here
});
