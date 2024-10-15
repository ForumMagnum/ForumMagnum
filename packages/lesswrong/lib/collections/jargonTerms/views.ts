import JargonTerms from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface JargonTermsViewTerms extends ViewTermsBase {
    view?: JargonTermsViewName
    postId?: string
    rejected?: boolean
    forLaTeX?: boolean
  }
}

JargonTerms.addDefaultView((terms: JargonTermsViewTerms) => {
  return {
    selector: { deleted: false },
  };
});

JargonTerms.addView("jargonTerms", function (terms: JargonTermsViewTerms) {
  return {
    selector: { postId: terms.postId, deleted: null },
    options: { sort: { forLaTeX: -1, term: 1, createdAt: 1 } }
  };
});
