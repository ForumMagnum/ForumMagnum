import { PostRelations } from "./collection"
import { ensureIndex } from '../../collectionUtils';

PostRelations.addView("allPostRelations", function (terms) {
  return {
    selector: {$or: [{sourcePostId: terms.postId}, {targetPostId: terms.postId, sourcePostId: {$ne: terms.postId}}]},
    options: {sort: {order: 1, createdAt: -1}}
  };
});
ensureIndex(PostRelations, {sourcePostId:1, order:1, createdAt:-1});
