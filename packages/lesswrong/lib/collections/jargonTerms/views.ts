import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

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

function postEditorJargonTerms(terms: PostJargonTermsViewTerms) {
  return {
    selector: { postId: terms.postId },
    options: { sort: { term: 1, createdAt: 1 } }
  };
}

function glossaryEditAll(terms: GlossaryEditAllViewTerms) {
  return {
    selector: {},
    options: { sort: { term: 1, createdAt: 1 } }
  };
}

function postsApprovedJargon(terms: PostsApprovedJargonViewTerms) {
  return {
    selector: { postId: { $in: terms.postIds }, approved: true },
    options: { sort: { term: 1, createdAt: 1 } }
  };
}

export const JargonTermsViews = new CollectionViewSet('JargonTerms', {
  postEditorJargonTerms,
  glossaryEditAll,
  postsApprovedJargon
});
