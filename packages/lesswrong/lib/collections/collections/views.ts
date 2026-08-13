import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface CollectionsViewTerms extends ViewTermsBase {
    view: CollectionsViewName | 'default' | undefined,
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

/**
 * Collections shown as rows in the /library redesign's merged all-sequences
 * list. Oldest first, which leads with Rationality: A-Z per the design mock.
 */
function libraryCollections(_terms: CollectionsViewTerms) {
  return {
    selector: {},
    options: {
      sort: {
        createdAt: 1,
      },
    },
  };
}

export const CollectionsViews = new CollectionViewSet(
  'Collections',
  {libraryCollections},
  defaultView
);
