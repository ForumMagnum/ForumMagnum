import { Collections } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface CollectionsViewTerms extends ViewTermsBase {
    collectionIds?: string[]
  }
}

Collections.addDefaultView((terms: CollectionsViewTerms) => {
  let params = {
    selector: {
      ...(terms.collectionIds && {_id: {$in: terms.collectionIds}}),
    }
  }
  return params;
})

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });
