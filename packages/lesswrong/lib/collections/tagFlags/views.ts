import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface TagFlagsViewTerms extends ViewTermsBase {
    view?: TagFlagsViewName
    userId?: string
  }
}

function allTagFlags(terms: TagFlagsViewTerms) {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {order: 1, name: -1},
    },
  };
}

export const TagFlagsViews = new CollectionViewSet('TagFlags', {
  allTagFlags
});
