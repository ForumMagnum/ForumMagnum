import { LWEvents } from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

ensureIndex(LWEvents, {name:1, createdAt:-1});
ensureIndex(LWEvents, {documentId:1, userId:1, deleted:1, name:1, createdAt:-1});

// Auto-generated indexes from production
ensureIndex(LWEvents, {name:1, documentId:1, userId:1}, {background:true})
ensureIndex(LWEvents, {name:1, createdAt:-1, _id:-1}, {background: true})
ensureIndex(LWEvents, {documentId:1, name:1, createdAt:-1, _id:-1, deleted:1}, {background:true})


LWEvents.addView("adminView", function (terms) {
  return {
    selector: {name: terms.name || null},
    options: {sort: {createdAt: -1}}
  };
});

LWEvents.addView("postVisits", function (terms) {
  return {
    selector: {
      documentId: terms.postId,
      userId: terms.userId,
      name: "post-view",
      deleted: {$ne:true}
    },
    options: {sort: {createdAt: -1}, limit: terms.limit || 1},
  };
});
