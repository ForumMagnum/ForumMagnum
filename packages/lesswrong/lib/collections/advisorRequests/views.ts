import AdvisorRequests from "./collection"

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
