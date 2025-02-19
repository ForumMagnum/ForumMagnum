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

  interface PostsApprovedJargonViewTerms {
    view: 'postsApprovedJargon',
    postIds: string[]
  }

  type JargonTermsViewTerms = Omit<ViewTermsBase, 'view'> & (PostJargonTermsViewTerms | GlossaryEditAllViewTerms | PostsApprovedJargonViewTerms | {
    view?: undefined,
    postId?: undefined,
    postIds?: undefined
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

JargonTerms.addView("postsApprovedJargon", function (terms: PostsApprovedJargonViewTerms) {
  return {
    selector: { postId: { $in: terms.postIds }, approved: true },
    options: { sort: { term: 1, createdAt: 1 } }
  };
});
