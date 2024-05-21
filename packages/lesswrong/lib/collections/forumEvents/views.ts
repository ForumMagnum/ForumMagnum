import ForumEvents from "./collection";
import { ensureIndex } from "../../collectionIndexUtils";

declare global {
  interface ForumEventsViewTerms extends ViewTermsBase {
    view?: ForumEventsViewName
  }
}

ForumEvents.addView("upcomingForumEvents", (terms: ForumEventsViewTerms) => {
  return {
    selector: {endDate: {$gt: new Date()}},
    options: {
      sort: {createdAt: 1},
      limit: terms.limit ?? 20,
    },
  };
});
ensureIndex(ForumEvents, {endDate: 1})

ForumEvents.addView("pastForumEvents", (terms: ForumEventsViewTerms) => {
  return {
    selector: {endDate: {$lte: new Date()}},
    options: {
      sort: {createdAt: 1},
      limit: terms.limit ?? 20,
    },
  };
});

ForumEvents.addView("currentForumEvent", (_terms: ForumEventsViewTerms) => {
  const now = new Date();
  return {
    selector: {
      startDate: {$lt: now},
      endDate: {$gt: now},
    },
    options: {
      sort: {createdAt: 1},
      limit: 1,
    },
  };
});
