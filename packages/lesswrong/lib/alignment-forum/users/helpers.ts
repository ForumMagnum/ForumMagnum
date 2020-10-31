import Users from "../../collections/users/collection";

export const userCanSuggestPostForAlignment = ({currentUser, post}) => {
  return currentUser && post && !post.af && !post.reviewForAlignmentUserId && Users.canDo(currentUser, "posts.alignment.suggest")
}

export const userCanMakeAlignmentPost = (user, post) => {
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
