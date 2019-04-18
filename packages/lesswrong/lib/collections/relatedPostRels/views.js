import { RelatedPostRels } from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

RelatedPostRels.addView("allPostRels", function (terms) {
  return {
    selector: {$or: [{parentPostId: terms.postId}, {childPostId: terms.postId, parentPostId: {$ne: terms.postId}}]},
    options: {sort: {order: 1, createdAt: -1}}
  };
});
ensureIndex(RelatedPostRels, {parentPostId:1, order:1, createdAt:-1});
