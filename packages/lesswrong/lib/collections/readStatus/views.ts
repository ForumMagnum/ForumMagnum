import ReadStatus from "./collection"

declare global {
  interface ReadStatusViewTerms extends ViewTermsBase {
    view?: ReadStatusViewName
  }
}

ReadStatus.addView("activeResources", function (terms: ReadStatusViewTerms) {
  return {
    selector: {
      expiresAt: {$gt: new Date()},
    },
    options: {
      limit: 5,
    },
  }
});
