import { ensureIndex } from "../../collectionIndexUtils";
import Spotlights from "./collection";

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {
    sequenceId?: string;
  }
}

Spotlights.addView("mostRecentlyPromotedSpotlights", function (terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {
      draft: false,
      lastPromotedAt: { $lt: new Date() },
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
  return {
    options: {
      sort: { lastPromotedAt: -1, position: 1 },
      ...limit
    }
  }
});

Spotlights.addView("spotlightForSequence", (terms: SpotlightsViewTerms) => {
  return {
    selector: {
      documentId: terms.sequenceId,
      draft: false
    },
    options: {
      sort: { position: 1 }
    }
  }
});
