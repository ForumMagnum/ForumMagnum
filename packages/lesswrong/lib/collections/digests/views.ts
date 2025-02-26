import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface DigestsViewTerms extends ViewTermsBase {
    view?: DigestsViewName,
    num?: number
  }
}

function findByNum(terms: DigestsViewTerms) {
  return {
    selector: {num: terms.num},
    options: {limit: 1}
  }
}

function all(terms: DigestsViewTerms) {
  return {
    options: {sort: {num: -1}}
  }
}

export const DigestsViews = new CollectionViewSet('Digests', {
  findByNum,
  all
});
