import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface UserJobAdsViewTerms extends ViewTermsBase {
    view: UserJobAdsViewName
    userId?: string
  }
}

function adsByUser(terms: UserJobAdsViewTerms) {
  return {
    selector: {
      userId: terms.userId
    }
  };
}

export const UserJobAdsViews = new CollectionViewSet('UserJobAds', {
  adsByUser
});
