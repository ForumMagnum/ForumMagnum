import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import type { ForumTypeString } from "../../instanceSettings";

export const userCanSuggestPostForAlignment = ({currentUser, post}: {
  currentUser: UsersCurrent|DbUser|null,
  post: PostsBase|DbPost
}) => {
  return currentUser && post && !post.af && !post.reviewForAlignmentUserId && userCanDo(currentUser, "posts.alignment.suggest")
}

export const userCanMakeAlignmentPost = (user: DbUser|UsersCurrent|null, post: PostsBase|DbPost) => {
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

export const userCanMakeAlignmentComment = (user: DbUser|UsersCurrent|null) => {
  return userCanDo(user, 'comments.alignment.new')
}

export const userNeedsAFNonMemberWarning = (user: DbUser|UsersCurrent|null, forumType: ForumTypeString, initial =true) => {
  
  return (!!user
    && forumType === 'AlignmentForum'
    && (!user.hideAFNonMemberInitialWarning || !initial) 
    && !(userCanDo(user, 'comments.alignment.new')||userCanDo(user, 'posts.alignment.new')))
}
