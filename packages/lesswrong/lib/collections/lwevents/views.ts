import { LWEvents } from "./collection"
import { ensureIndex } from '../../collectionUtils';

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
      deleted: {$in: [false,null]} //FIXME: deleted isn't in the schema!
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
  return {
    selector: {
      name: "gatherTownUsersCheck"
    },
    options: {
      sort: {createdAt: -1}
    }
  }
})
