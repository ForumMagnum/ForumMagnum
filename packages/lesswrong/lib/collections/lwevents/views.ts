import { LWEvents } from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface LWEventsViewTerms extends ViewTermsBase {
    view?: LWEventsViewName
    name?: string,
    postId?: string,
    userId?: string,
  }
}


LWEvents.addView("adminView", (terms: LWEventsViewTerms) => {
  return {
    selector: {name: terms.name || null},
    options: {sort: {createdAt: -1}}
  };
});
ensureIndex(LWEvents, {name:1, createdAt:-1});

LWEvents.addView("postVisits", (terms: LWEventsViewTerms) => {
  return {
    selector: {
      documentId: terms.postId,
      userId: terms.userId,
      name: "post-view",
    },
    options: {sort: {createdAt: -1}, limit: terms.limit || 1},
  };
});

LWEvents.addView("emailHistory", (terms: LWEventsViewTerms) => {
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

LWEvents.addView("gatherTownUsers", (terms: LWEventsViewTerms) => {
  const oneHourAgo = new Date(new Date().getTime()-(60*60*1000));
  return {
    selector: {
      name: "gatherTownUsersCheck",
      "properties.checkFailed": false,
      createdAt: {$gt: oneHourAgo},
    },
    options: {
      sort: {createdAt: -1}
    }
  }
})

// Index used in manual user-by-IP queries, and in some moderator UI
ensureIndex(LWEvents, {name:1, "properties.ip":1, createdAt:1, userId:1})
