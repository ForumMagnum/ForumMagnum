import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface RejectionAppealsViewTerms extends ViewTermsBase {
    view: RejectionAppealsViewName
    userId?: string
  }
}

function openAppeals(terms: RejectionAppealsViewTerms) {
  return {
    selector: { status: "open" },
    options: { sort: { createdAt: 1 } },
  };
}

function userAppeals(terms: RejectionAppealsViewTerms) {
  return {
    selector: { userId: terms.userId },
    options: { sort: { createdAt: -1 } },
  };
}

export const RejectionAppealsViews = new CollectionViewSet('RejectionAppeals', {
  openAppeals,
  userAppeals,
});
