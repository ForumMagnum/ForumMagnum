import { CollectionViewSet } from "@/lib/views/collectionViewSet";

declare global {
  interface UserEAGDetailsViewTerms extends ViewTermsBase {
    view?: UserEAGDetailsViewName
    userId?: string
  }
}

function dataByUser(terms: UserEAGDetailsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
}

export const UserEAGDetailsViews = new CollectionViewSet('UserEAGDetails', { dataByUser });
