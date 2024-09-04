import { ensureIndex } from "../../collectionIndexUtils";
import Spotlights from "./collection";

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {
    sequenceId?: string;
    subtitle?: string;
  }
}

Spotlights.addView("mostRecentlyPromotedSpotlights", function (terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {
      draft: false,
      deletedDraft: false,
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
    selector: {
      deletedDraft: false
    },
    options: {
      sort: {draft: 1, lastPromotedAt: -1, position: 1 },
      ...limit
    }
  }
});

Spotlights.addView("spotlightsPageDraft", function (terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {
      deletedDraft: false,
      draft: true
    },
    options: {
      sort: { documentId: 1, position: 1, createdAt: 1 },
      ...limit
    }
  }
});

Spotlights.addView("spotlightForSequence", (terms: SpotlightsViewTerms) => {
  return {
    selector: {
      documentId: terms.sequenceId,
      draft: false,
      deletedDraft: false
    },
    options: {
      sort: { position: 1 }
    }
  }
});


Spotlights.addView("spotlightsBySubtitle", (terms: SpotlightsViewTerms) => {
  return {
    selector: {
      customSubtitle: terms.subtitle,
      draft: false,
      deletedDraft: false
    },
    options: {
      sort: { position: 1 }
    }
  }
});
