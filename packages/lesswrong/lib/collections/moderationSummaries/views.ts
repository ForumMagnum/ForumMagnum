import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ModerationSummariesSummariesForUserViewTerms {
    view: 'summariesForUser',
    targetUserId: string,
  }

  interface ModerationSummariesGroupingsViewTerms {
    view: 'groupings',
  }

  type ModerationSummariesViewTerms = Omit<ViewTermsBase, 'view'> & (
    ModerationSummariesSummariesForUserViewTerms |
    ModerationSummariesGroupingsViewTerms |
    {
      view?: undefined,
      targetUserId?: never,
    }
  )
}

function summariesForUser(terms: ModerationSummariesSummariesForUserViewTerms) {
  return {
    selector: {
      kind: 'userSummary',
      targetUserId: terms.targetUserId,
      deleted: false,
    },
    options: {
      sort: { createdAt: -1 },
    },
  };
}

function groupings(_terms: ModerationSummariesGroupingsViewTerms) {
  return {
    selector: {
      kind: 'userGrouping',
      deleted: false,
    },
    options: {
      sort: { createdAt: -1 },
    },
  };
}

export const ModerationSummariesViews = new CollectionViewSet('ModerationSummaries', {
  summariesForUser,
  groupings,
});
