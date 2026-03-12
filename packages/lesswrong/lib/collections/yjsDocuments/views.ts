import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface YjsDocumentsViewTerms extends ViewTermsBase {
    view: YjsDocumentsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const YjsDocumentsViews = new CollectionViewSet('YjsDocuments', {
  // Add your view functions here
});
