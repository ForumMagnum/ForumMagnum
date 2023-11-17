import Reports from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface ReportsViewTerms extends ViewTermsBase {
    view?: ReportsViewName
    userId?: string
  }
}

//Messages for a specific conversation
Reports.addView("allReports", function (terms: ReportsViewTerms) {
  return {
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(Reports, {createdAt: 1});

Reports.addView("unclaimedReports", function (terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: {$exists: false }},
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(Reports, {claimedUserId:1, createdAt: 1});

Reports.addView("claimedReports", function (terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: {$exists: true }},
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("adminClaimedReports", function (terms: ReportsViewTerms) {
  return {
    selector: {claimedUserId: terms.userId },
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("sunshineSidebarReports", function (terms: ReportsViewTerms) {
  return {
    selector: {
      closedAt: {$exists: false}
    },
    options: {sort: {createdAt: -1}}
  };
});
ensureIndex(Reports, {closedAt:1, createdAt: 1});

Reports.addView("closedReports", function (terms: ReportsViewTerms) {
  return {
    selector: {closedAt: {$exists: true }},
    options: {sort: {closedAt: 1, createdAt: 1}}
  };
});
