import { Collections } from './collection';
import { ensureIndex } from '../../collectionUtils';

declare global {
  interface CollectionsViewTerms extends ViewTermsBase {
    view?: CollectionsViewName
  }
}

Collections.addView("allCollections", (terms) => {
  return {
    selector: {
      deleted: false
    },
    options: {
      sort: {
        order: 1
      }
    }
  }
});

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });
