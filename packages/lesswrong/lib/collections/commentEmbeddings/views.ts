import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface CommentEmbeddingsViewTerms extends ViewTermsBase {
    view: CommentEmbeddingsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const CommentEmbeddingsViews = new CollectionViewSet('CommentEmbeddings', {
  // Add your view functions here
});
