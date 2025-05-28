import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface UserTagRelsViewTerms extends ViewTermsBase {
    view: UserTagRelsViewName
    userId?: string,
    tagId?: string,
  }
}

function single(terms: UserTagRelsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      tagId: terms.tagId,
    }
  };
}

export const UserTagRelsViews = new CollectionViewSet('UserTagRels', {
  single
});
