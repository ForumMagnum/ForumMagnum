import { ensureIndex } from "../../collectionIndexUtils";
import Spotlights from "./collection";

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {
    after?: string;
    draft?: boolean;
  }
}

Spotlights.addView("mostRecentlyPromotedSpotlights", function (terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {
      draft: false
    },
    options: {
      sort: { lastPromotedAt: -1, position: 1 },
      ...limit
    }
  }
});

ensureIndex(Spotlights, { lastPromotedAt: -1 });
ensureIndex(Spotlights, { position: -1 });

Spotlights.addView("spotlightsPage", function (terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  let selector = {
    draft: true
    // createdAt: terms.after ? { $gt: new Date(terms.after) } : {},
    // draft: terms.draft ?? undefined,
  }
  return {
    selector,
    options: {
      sort: { lastPromotedAt: -1, position: 1 },
      ...limit
    }
  }
});

