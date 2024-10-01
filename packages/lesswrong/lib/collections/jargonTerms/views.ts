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

JargonTerms.addView("jargonTerms", function (terms: JargonTermsViewTerms) {
    return {
      selector: {postId: terms.postId, rejected: terms.rejected, forLaTeX: terms.forLaTeX},
      options: {sort: {createdAt: 1}}
    };
  });