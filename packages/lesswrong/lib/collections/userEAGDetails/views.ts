import UserEAGDetails from "./collection"

declare global {
  interface UserEAGDetailsViewTerms extends ViewTermsBase {
    view?: UserEAGDetailsViewName
    userId?: string
  }
}

UserEAGDetails.addView("dataByUser", function (terms: UserEAGDetailsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
});
