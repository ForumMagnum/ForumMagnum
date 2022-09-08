import AdvisorRequests from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface AdvisorRequestsViewTerms extends ViewTermsBase {
    view?: AdvisorRequestsViewName
    userId?: string
  }
}

AdvisorRequests.addView("requestsByUser", function (terms: AdvisorRequestsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
});
ensureIndex(AdvisorRequests, { userId: 1 })
