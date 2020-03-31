import Users from "../../collections/users/collection";

Users.canSuggestPostForAlignment = ({currentUser, post}) => {
  return currentUser && post && !post.af && !post.reviewForAlignmentUserId && Users.canDo(currentUser, "posts.alignment.suggest")
}

Users.canMakeAlignmentPost = (user, post) => {
  if (Users.canDo(user,"posts.moderate.all") && Users.canDo(user, "posts.alignment.move")) {
    return true
  }
  if (Users.canDo(user,"posts.alignment.move.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    user._id === post.userId &&
    Users.canDo(user,"posts.alignment.move") &&
    Users.owns(user, post)
  )
}
