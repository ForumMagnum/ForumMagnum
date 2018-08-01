import Users from "meteor/vulcan:users";
import bowser from 'bowser'
import { getSetting } from 'meteor/vulcan:core';


Users.isSharedOn = (currentUser, document) => {
  return (currentUser && document.shareWithUsers && document.shareWithUsers.includes(currentUser._id))
}

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

Users.canCommentLock = (user, post) => {
  if (Users.canDo(user,"posts.commentLock.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    Users.canDo(user,"posts.commentLock.own") &&
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
  if (post.commentsLocked) {
    return false
  }

  if (getSetting('AlignmentForum', false)) {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return Users.owns(user, post)
    }
  }

  return true
}

Users.blockedCommentingReason = (user, post) => {
  if (!user) {
    return "Can't recognize user"
  }

  if (Users.userIsBannedFromPost(user, post)) {
    return "This post's author has blocked you from commenting."
  }
  if (getSetting('AlignmentForum', false)) {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return "You must be approved by an admin to comment on Alignment Forum"
    }
  }
  if (Users.userIsBannedFromAllPosts(user, post)) {
    return "This post's author has blocked you from commenting."
  }
  if (post.commentsLocked) {
    return "Comments on this post are disabled."
  }
  return "You cannot comment at this time"
}



const clientRequiresMarkdown = () => {
  if (Meteor.isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}

Users.useMarkdownCommentEditor = (user) => {
  if (clientRequiresMarkdown()) {
    return true
  }
  return user && user.markDownCommentEditor
}

Users.useMarkdownPostEditor = (user) => {
  if (clientRequiresMarkdown()) {
    return true
  }
  return user && user.markDownPostEditor
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
