import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface LWEventsViewTerms extends ViewTermsBase {
    view?: LWEventsViewName
    name?: string,
    postId?: string,
    userId?: string,
    postIds?: string[]
  }
}

function adminView(terms: LWEventsViewTerms) {
  return {
    selector: {name: terms.name || null},
    options: {sort: {createdAt: -1}}
  };
}

function postVisits(terms: LWEventsViewTerms) {
  return {
    selector: {
      documentId: terms.postId,
      userId: terms.userId,
      name: "post-view",
    },
    options: {sort: {createdAt: -1}, limit: terms.limit || 1},
  };
}

function emailHistory(terms: LWEventsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      name: "emailSent",
    },
    options: {
      sort: {createdAt: -1}
    }
  }
}

function gatherTownUsers(terms: LWEventsViewTerms) {
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
}

function postEverPublished(terms: LWEventsViewTerms) {
  return {
    selector: {
      name: 'fieldChanges',
      documentId: { $in: terms.postIds },
      'properties.before.draft': false,
      'properties.after.draft': true
    }
  }
}

export const LWEventsViews = new CollectionViewSet('LWEvents', {
  adminView,
  postVisits,
  emailHistory,
  gatherTownUsers,
  postEverPublished
});
