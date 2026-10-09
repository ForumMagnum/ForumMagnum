import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ModerationProposalsProposalsForUserViewTerms {
    view: 'proposalsForUser',
    targetUserId: string,
    statuses?: string[],
  }

  interface ModerationProposalsPendingProposalsViewTerms {
    view: 'pendingProposals',
  }

  type ModerationProposalsViewTerms = Omit<ViewTermsBase, 'view'> & (
    ModerationProposalsProposalsForUserViewTerms |
    ModerationProposalsPendingProposalsViewTerms |
    {
      view?: undefined,
      targetUserId?: never,
      statuses?: never,
    }
  )
}

function proposalsForUser(terms: ModerationProposalsProposalsForUserViewTerms) {
  return {
    selector: {
      targetUserId: terms.targetUserId,
      status: { $in: terms.statuses ?? ['pending'] },
    },
    options: {
      sort: { createdAt: -1 },
    },
  };
}

function pendingProposals(_terms: ModerationProposalsPendingProposalsViewTerms) {
  return {
    selector: {
      status: 'pending',
    },
    options: {
      sort: { createdAt: -1 },
    },
  };
}

export const ModerationProposalsViews = new CollectionViewSet('ModerationProposals', {
  proposalsForUser,
  pendingProposals,
});
