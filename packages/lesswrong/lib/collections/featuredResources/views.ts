import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface FeaturedResourcesViewTerms extends ViewTermsBase {
    view: FeaturedResourcesViewName | undefined
  }
}

function activeResources(terms: FeaturedResourcesViewTerms) {
  return {
    selector: {
      expiresAt: {$gt: new Date()},
    },
    options: {
      limit: 5,
    },
  }
}

export const FeaturedResourcesViews = new CollectionViewSet('FeaturedResources', {
  activeResources
});
