import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface AdvisorRequestsViewTerms extends ViewTermsBase {
    view: AdvisorRequestsViewName
    userId?: string
  }
}

function requestsByUser(terms: AdvisorRequestsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
};

export const AdvisorRequestsViews = new CollectionViewSet('AdvisorRequests', {
  requestsByUser
});
