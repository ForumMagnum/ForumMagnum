import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface RejectionAppealsViewTerms extends ViewTermsBase {
    view: RejectionAppealsViewName
  }
}

function openAppeals() {
  return {
    selector: { status: "open" },
    options: { sort: { createdAt: 1 } },
  };
}

export const RejectionAppealsViews = new CollectionViewSet('RejectionAppeals', {
  openAppeals,
});
