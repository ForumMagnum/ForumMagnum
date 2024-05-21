import UserEAGDetails from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

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
ensureIndex(UserEAGDetails, { userId: 1 }, { unique: true })
