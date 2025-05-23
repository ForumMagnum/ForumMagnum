import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface UltraFeedEventsViewTerms extends ViewTermsBase {
    view: UltraFeedEventsViewName | undefined
    // Add your view terms here
  }
}

// Define your view functions here

export const UltraFeedEventsViews = new CollectionViewSet('UltraFeedEvents', {
  // Add your view functions here
});
