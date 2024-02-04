import UserJobAds from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

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
ensureIndex(UserJobAds, { userId: 1 })
