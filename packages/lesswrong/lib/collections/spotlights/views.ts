import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {
    documentIds?: string[];
  }
}

function mostRecentlyPromotedSpotlights(terms: SpotlightsViewTerms) {
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
}

function spotlightsPage(terms: SpotlightsViewTerms) {
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
}

function spotlightsPageDraft(terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {
      deletedDraft: false,
      draft: true
    },
    options: {
      sort: { documentId: 1, _id: 1 },
      ...limit
    }
  }
}

function spotlightsByDocumentIds(terms: SpotlightsViewTerms) {
  return {
    selector: {
      documentId: { $in: terms.documentIds },
      draft: false,
      deletedDraft: false
    },
    options: {
      sort: { position: 1 }
    }
  }
}

export const SpotlightsViews = new CollectionViewSet('Spotlights', {
  mostRecentlyPromotedSpotlights,
  spotlightsPage,
  spotlightsPageDraft,
  spotlightsByDocumentIds
});

