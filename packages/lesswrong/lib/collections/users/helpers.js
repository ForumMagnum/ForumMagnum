import Users from "meteor/vulcan:users";

Users.canModeratePost = (user, post) => {
  return user && post &&
    (
      Users.canDo(user,"posts.moderate.all") ||
      (
        Users.canDo(user,"posts.moderate.own") &&
        Users.owns(user, post) &&
        post.user.moderationStyle
      )
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
