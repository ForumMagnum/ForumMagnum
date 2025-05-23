import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface PostRelationsViewTerms extends ViewTermsBase {
    view: PostRelationsViewName
    postId?: string,
  }
}

function allPostRelations(terms: PostRelationsViewTerms) {
  return {
    selector: {$or: [
      {sourcePostId: terms.postId},
      {targetPostId: terms.postId, sourcePostId: {$ne: terms.postId}}
    ]},
    options: {sort: {order: 1, createdAt: -1}}
  };
}

export const PostRelationsViews = new CollectionViewSet('PostRelations', {
  allPostRelations
});
