import Users from "meteor/vulcan:users";

Users.canEditUsersBannedUserIds = (currentUser, targetUser) => {
  if (Users.canDo(currentUser,"posts.moderate.all")) {
    return true
  }
  if (!currentUser || !targetUser) {
    return false
  }
  return !!(
    Users.canDo(currentUser,"posts.moderate.own") &&
    targetUser.moderationStyle
  )
}

Users.canModeratePost = (user, post) => {
  if (Users.canDo(user,"posts.moderate.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    user._id === post.userId &&
    user.moderationStyle &&
    Users.canDo(user,"posts.moderate.own") &&
    Users.owns(user, post)
  )
}

Users.userIsBannedFromPost = (user, post) => {
  const postAuthor = post.user || Users.findOne(post.userId)
  return !!(
    post &&
    post.bannedUserIds &&
    post.bannedUserIds.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own') &&
    Users.owns(postAuthor, post)
  )
}

Users.userIsBannedFromAllPosts = (user, post) => {
  const postAuthor = post.user || Users.findOne(post.userId)
  return !!(
    postAuthor &&
    postAuthor.bannedUserIds &&
    postAuthor.bannedUserIds.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own') &&
    Users.owns(postAuthor, post)
  )
}

Users.isAllowedToComment = (user, post) => {
  if (!user) {
    return false
  }

  if (!post) {
    return true
  }

  if (Users.userIsBannedFromPost(user, post)) {
    return false
  }

  if (Users.userIsBannedFromAllPosts(user, post)) {
    return false
  }

  return true
}
