import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface FieldChangesViewTerms extends ViewTermsBase {
    view: FieldChangesViewName
  }
}

// Define your view functions here

export const FieldChangesViews = new CollectionViewSet('FieldChanges', {
  // Add your view functions here
});
