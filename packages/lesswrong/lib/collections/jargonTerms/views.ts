import { ensureIndex } from "@/lib/collectionIndexUtils";
import JargonTerms from "./collection"

declare global {
  interface PostJargonTermsViewTerms {
    view: 'postEditorJargonTerms',
    postId: string
  }

  interface GlossaryEditAllViewTerms {
    view: 'glossaryEditAll',
  }

  type JargonTermsViewTerms = Omit<ViewTermsBase, 'view'> & (PostJargonTermsViewTerms | GlossaryEditAllViewTerms | {
    view?: undefined,
    postId?: string,
  });
}

ensureIndex(JargonTerms, { postId: 1, term: 1, createdAt: 1 });

JargonTerms.addView("postEditorJargonTerms", function (terms: PostJargonTermsViewTerms) {
  return {
    selector: { postId: terms.postId },
    options: { sort: { term: 1, createdAt: 1 } }
  };
});

JargonTerms.addView("glossaryEditAll", function (terms: GlossaryEditAllViewTerms) {
  return {
    selector: {},
    options: { sort: { term: 1, createdAt: 1 } }
  };
});
