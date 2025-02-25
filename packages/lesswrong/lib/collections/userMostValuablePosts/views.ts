import UserMostValuablePosts from "./collection"

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

UserMostValuablePosts.addView("currentUserPost", function (terms: UserMostValuablePostsViewTerms, _, context?: ResolverContext) {
  return {
    selector: {
      userId: context?.currentUser?._id,
      postId: terms.postId
    }
  };
});
