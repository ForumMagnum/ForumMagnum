import Users from "meteor/vulcan:users";

Users.canSuggestPostForAlignment = ({currentUser, post}) => {
  return currentUser && post && !post.afDate && !post.reviewForAlignmentUserId && Users.canDo(currentUser, "posts.alignment.suggest")
}
