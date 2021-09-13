import FeaturedResources from "./collection"

declare global {
  interface FeaturedResourcesViewTerms extends ViewTermsBase {
    view?: FeaturedResourcesViewName
  }
}

FeaturedResources.addView("activeUnexpiredResources", function (terms: FeaturedResourcesViewTerms) {
  return {
    selector: {
      expiresAt: {$gt: new Date(0)},
      isActive: true,
    },
    options: {
      sort: { expiresAt: 1 },
    }
  }
});
