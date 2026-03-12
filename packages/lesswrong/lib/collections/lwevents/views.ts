import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface LWEventsViewTerms extends ViewTermsBase {
    view: LWEventsViewName
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

export const LWEventsViews = new CollectionViewSet('LWEvents', {
  adminView,
  postVisits,
  emailHistory,
});
