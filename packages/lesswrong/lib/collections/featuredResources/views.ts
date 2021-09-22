import FeaturedResources from "./collection"

declare global {
  interface FeaturedResourcesViewTerms extends ViewTermsBase {
    view?: FeaturedResourcesViewName
  }
}

FeaturedResources.addView("activeUnexpiredResources", function (terms: FeaturedResourcesViewTerms) {
  return {
    selector: {
      expiresAt: {$gt: new Date()},
      isActive: true,
    },
    options: {
      sort: { expiresAt: 1 },
    }
  }
});
