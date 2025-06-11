import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface CollectionsViewTerms extends ViewTermsBase {
    view: 'default' | undefined,
    collectionIds?: string[]
  }
}

function defaultView(terms: CollectionsViewTerms) {
  return {
    selector: {
      ...(terms.collectionIds && {_id: {$in: terms.collectionIds}}),
    }
  };
};

export const CollectionsViews = new CollectionViewSet(
  'Collections', 
  {}, 
  defaultView
);
