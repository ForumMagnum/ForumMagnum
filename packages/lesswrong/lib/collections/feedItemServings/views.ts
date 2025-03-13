import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface FeedItemServingsViewTerms extends ViewTermsBase {
    view?: FeedItemServingsViewName
    userId?: string
    limit?: number
  }
}

// Define your view functions here

export const FeedItemServingsViews = new CollectionViewSet('FeedItemServings', {
  // Add your view functions here
  userHistory: (terms: FeedItemServingsViewTerms) => ({
    selector: {
      userId: terms.userId,
    },
    options: {
      sort: { servedAt: -1 },
      limit: terms.limit || 20,
    }
  }),
});
