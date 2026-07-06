import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SpotlightsViewTerms extends ViewTermsBase {
    documentIds?: string[];
    spotlightIds?: string[];
  }
}

function spotlightsPage(terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {},
    options: {
      sort: {startDate: -1, createdAt: -1},
      ...limit
    }
  }
}

function spotlightsPageDraft(terms: SpotlightsViewTerms) {
  const limit = terms.limit ? { limit: terms.limit } : {};
  return {
    selector: {},
    options: {
      sort: {documentId: 1, _id:1},
      ...limit
    }
  }
}

function spotlightsByDocumentIds(terms: SpotlightsViewTerms) {
  return {
    selector: {
      documentId: { $in: terms.documentIds },
    },
    options: {
      sort: {startDate: -1, createdAt: -1}
    }
  }
}

function spotlightsById(terms: SpotlightsViewTerms) {
  return {
    selector: {
      _id: { $in: terms.spotlightIds },
    },
    options: {
      sort: {startDate: -1, createdAt: -1}
    }
  }
}

export const SpotlightsViews = new CollectionViewSet('Spotlights', {
  spotlightsPage,
  spotlightsPageDraft,
  spotlightsByDocumentIds,
  spotlightsById
});
