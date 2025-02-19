import UserMostValuablePosts from "./collection"
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface UserMostValuablePostsViewTerms extends ViewTermsBase {
    view?: UserMostValuablePostsViewName
    userId?: string,
    postId?: string
  }
}

UserMostValuablePosts.addView("currentUserMostValuablePosts", function (terms, _, context?: ResolverContext) {
  return {
    selector: {
      userId: context?.currentUser?._id
    }
  };
});
ensureIndex(UserMostValuablePosts, { userId: 1 })

UserMostValuablePosts.addView("currentUserPost", function (terms: UserMostValuablePostsViewTerms, _, context?: ResolverContext) {
  return {
    selector: {
      userId: context?.currentUser?._id,
      postId: terms.postId
    }
  };
});
ensureIndex(UserMostValuablePosts, { userId: 1, postId: 1 })
