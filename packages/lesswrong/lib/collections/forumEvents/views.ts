import moment from 'moment';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ForumEventsViewTerms extends ViewTermsBase {
    view?: ForumEventsViewName
  }
}

function upcomingForumEvents(terms: ForumEventsViewTerms) {
  return {
    selector: {endDate: {$gt: new Date()}},
    options: {
      sort: {createdAt: 1},
      limit: terms.limit ?? 20,
    },
  };
}

function pastForumEvents(terms: ForumEventsViewTerms) {
  return {
    selector: {endDate: {$lte: new Date()}},
    options: {
      sort: {createdAt: 1},
      limit: terms.limit ?? 20,
    },
  };
}

function currentForumEvent(_terms: ForumEventsViewTerms) {
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
}

function currentAndRecentForumEvents(terms: ForumEventsViewTerms) {
  return {
    selector: {
      startDate: {$lt: new Date()},
      endDate: {$gt: moment().subtract(2, 'weeks').toDate()},
    },
    options: {
      sort: {endDate: 1},
      limit: terms.limit ?? 20,
    },
  };
}

export const ForumEventsViews = new CollectionViewSet('ForumEvents', {
  upcomingForumEvents,
  pastForumEvents,
  currentForumEvent,
  currentAndRecentForumEvents,
});
