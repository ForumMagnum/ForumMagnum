import FeaturedResources from "./collection"

declare global {
  interface FeaturedResourcesViewTerms extends ViewTermsBase {
    view?: FeaturedResourcesViewName
  }
}

FeaturedResources.addView("activeResources", function (terms: FeaturedResourcesViewTerms) {
  return {
    selector: {
      expiresAt: {$gt: new Date()},
    },
    options: {
      sort: { expiresAt: 1 },
      limit: 1,
    }
  }
});
