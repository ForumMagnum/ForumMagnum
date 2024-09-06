import { LWEvents } from "./collection"
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface LWEventsViewTerms extends ViewTermsBase {
    view?: LWEventsViewName
    name?: string,
    postId?: string,
    userId?: string,
    postIds?: string[]
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
ensureCustomPgIndex(`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS "manual_idx__LWEvents_properties_ip"
    ON public."LWEvents" USING gin
    ((("properties"->>'ip')::TEXT))
    WITH (fastupdate=True)
    WHERE name='login';
`);

LWEvents.addView("postEverPublished", (terms) => ({
  selector: {
    name: 'fieldChanges',
    documentId: { $in: terms.postIds },
    'properties.before.draft': false,
    'properties.after.draft': true
  }
}));
