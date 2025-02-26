import UserJobAds from "./collection"

declare global {
  interface UserJobAdsViewTerms extends ViewTermsBase {
    view?: UserJobAdsViewName
    userId?: string
  }
}

UserJobAds.addView("adsByUser", function (terms: UserJobAdsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
});
