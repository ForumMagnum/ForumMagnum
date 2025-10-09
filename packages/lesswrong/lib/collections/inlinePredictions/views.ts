import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface InlinePredictionsViewTerms extends ViewTermsBase {
    view: InlinePredictionsViewName
  }
}

// Define your view functions here

export const InlinePredictionsViews = new CollectionViewSet('InlinePredictions', {
});
