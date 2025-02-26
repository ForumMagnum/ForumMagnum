import { PostRelations } from "./collection"

declare global {
  interface PostRelationsViewTerms extends ViewTermsBase {
    view?: PostRelationsViewName
    postId?: string,
  }
}

PostRelations.addView("allPostRelations", function (terms: PostRelationsViewTerms) {
  return {
    selector: {$or: [
      {sourcePostId: terms.postId},
      {targetPostId: terms.postId, sourcePostId: {$ne: terms.postId}}
    ]},
    options: {sort: {order: 1, createdAt: -1}}
  };
});
