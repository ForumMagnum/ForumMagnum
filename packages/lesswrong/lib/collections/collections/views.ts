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
    }
  }
});

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });
