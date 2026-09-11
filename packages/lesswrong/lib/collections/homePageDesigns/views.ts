import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface HomePageDesignsViewTerms extends ViewTermsBase {
    view: HomePageDesignsViewName
  }
}

// Views are not used — HomePageDesigns uses custom query resolvers instead
// of the default single/multi resolvers.
export const HomePageDesignsViews = new CollectionViewSet('HomePageDesigns', {});
