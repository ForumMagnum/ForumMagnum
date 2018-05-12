import Reports from "./collection.js"

//Messages for a specific conversation
Reports.addView("allReports", function (terms) {
  return {
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("unclaimedReports", function (terms) {
  return {
    selector: {claimedUserId: {$exists: false }},
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("claimedReports", function (terms) {
  return {
    selector: {claimedUserId: {$exists: true }},
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("adminClaimedReports", function (terms) {
  return {
    selector: {claimedUserId: terms.userId },
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("sunshineSidebarReports", function (terms) {
  return {
    selector: {
      closedAt: {$exists: false}
    },
    options: {sort: {createdAt: 1}}
  };
});

Reports.addView("closedReports", function (terms) {
  return {
    selector: {closedAt: {$exists: true }},
    options: {sort: {closedAt: 1, createdAt: 1}}
  };
});
