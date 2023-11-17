import Digests from "./collection";
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface DigestsViewTerms extends ViewTermsBase {
    view?: DigestsViewName,
    num?: number
  }
}

Digests.addView("findByNum", function (terms: DigestsViewTerms) {
  return {
    selector: {num: terms.num},
    options: {limit: 1}
  }
})

Digests.addView("all", function (terms: DigestsViewTerms) {
  return {
    options: {sort: {num: -1}}
  }
})
ensureIndex(Digests, { num: 1 })
