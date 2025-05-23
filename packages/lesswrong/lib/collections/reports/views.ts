import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ReportsViewTerms extends ViewTermsBase {
    view: ReportsViewName
    userId?: string
  }
}

function allReports(terms: ReportsViewTerms) {
  return {
    options: {sort: {createdAt: 1}}
  };
}

function unclaimedReports(terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: {$exists: false }},
    options: {sort: {createdAt: 1}}
  };
}

function claimedReports(terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: {$exists: true }},
    options: {sort: {createdAt: 1}}
  };
}

function adminClaimedReports(terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: terms.userId },
    options: {sort: {createdAt: 1}}
  };
}

function sunshineSidebarReports(terms: ReportsViewTerms) {
  return {
    selector: {
      closedAt: {$exists: false}
    },
    options: {sort: {createdAt: -1}}
  };
}

function closedReports(terms: ReportsViewTerms) {
  return {
    selector: {closedAt: {$exists: true }},
    options: {sort: {closedAt: 1, createdAt: 1}}
  };
}

export const ReportsViews = new CollectionViewSet('Reports', {
  allReports,
  unclaimedReports,
  claimedReports,
  adminClaimedReports,
  sunshineSidebarReports,
  closedReports
});
