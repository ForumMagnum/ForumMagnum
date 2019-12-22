import { LWEvents } from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

LWEvents.addView("adminView", function (terms) {
  return {
    selector: {name: terms.name || null},
    options: {sort: {createdAt: -1}}
  };
});
ensureIndex(LWEvents, {name:1, createdAt:-1});

LWEvents.addView("postVisits", function ({postId, userId, limit}) {
  return {
    selector: {
      documentId: postId,
      userId: userId,
      name: "post-view",
    },
    options: {sort: {createdAt: -1}, limit: limit || 1},
  };
});

LWEvents.addView("allPostVisits", ({userId, limit}) => {
  return {
    selector: {
      name: "post-view",
      userId,
    },
    options: {sort: {createdAt: -1}, limit: limit || 1}
  }
})

LWEvents.addView("emailHistory", function (terms) {
  return {
    selector: {
      userId: terms.userId,
      name: "emailSent",
    },
    options: {
      sort: {createdAt: -1}
    }
  }
});

ensureIndex(LWEvents, {name:1, userId:1, documentId:1, createdAt:-1})

// Used in constructAkismetReport
ensureIndex(LWEvents, {name:1, userId:1, createdAt:-1})
