import { ensureIndex } from "@/lib/collectionIndexUtils";
import JargonTerms from "./collection"

declare global {
  interface PostJargonTermsViewTerms {
    view: 'postEditorJargonTerms',
    postId?: string
  }

  type JargonTermsViewTerms = Omit<ViewTermsBase, 'view'> & (PostJargonTermsViewTerms | {
    view?: undefined,
    postId?: string,
  });
}

ensureIndex(JargonTerms, { postId: 1, term: 1, createdAt: 1 });

JargonTerms.addView("postEditorJargonTerms", function (terms: PostJargonTermsViewTerms) {
  if (terms.postId) {
    return {
      selector: { postId: terms.postId },
      options: { sort: { term: 1, createdAt: 1 } }
    };
  }
  return {
    selector: {},
    options: { sort: { term: 1, createdAt: 1 } }
  };
});

