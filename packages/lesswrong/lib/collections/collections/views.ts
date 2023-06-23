import { Collections } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

// Used in Posts and Sequences canonicalCollection resolvers
ensureIndex(Collections, { slug: "hashed" });

declare global {
  interface CollectionViewTerms extends ViewTermsBase {
    view?: CollectionsViewName
    slug?: string
  }
}

Collections.addDefaultView((terms: CollectionViewTerms) => {
  let params = {
    selector: {
      slug: terms.slug,
    }
  }
  return params;
})