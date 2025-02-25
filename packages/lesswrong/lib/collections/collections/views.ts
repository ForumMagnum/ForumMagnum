import { Collections } from './collection';

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
