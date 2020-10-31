import { userCanDo, userOwns } from '../../vulcan-users/permissions';

export const userCanSuggestPostForAlignment = ({currentUser, post}) => {
  return currentUser && post && !post.af && !post.reviewForAlignmentUserId && userCanDo(currentUser, "posts.alignment.suggest")
}

export const userCanMakeAlignmentPost = (user, post) => {
  if (userCanDo(user,"posts.moderate.all") && userCanDo(user, "posts.alignment.move")) {
    return true
  }
  if (userCanDo(user,"posts.alignment.move.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    user._id === post.userId &&
    userCanDo(user,"posts.alignment.move") &&
    userOwns(user, post)
  )
}
