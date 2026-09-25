import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface AiDigestIssuesViewTerms extends ViewTermsBase {
    view: AiDigestIssuesViewName
    recipientId?: string
  }
}

function recipientIssues(terms: AiDigestIssuesViewTerms) {
  return {
    selector: { recipientId: terms.recipientId },
    options: { sort: { createdAt: -1, _id: -1 } },
  };
}

export const AiDigestIssuesViews = new CollectionViewSet('AiDigestIssues', {
  recipientIssues,
});
