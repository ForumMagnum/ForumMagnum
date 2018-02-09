import Users from "meteor/vulcan:users";
import { Posts } from 'meteor/example-forum';

Users.canComment = (user, post) => {
  const userIsBannedFromPost = (user, post) => {
    if (!post.bannedUserIds) {
      return false
    } else {
      return post.bannedUserIds.includes(user._id)
    }
  }
  const userIsBannedFromAllPosts = (user, post) => {
    const postAuthor = post.user || Posts.findOne({userId:post.userId})
    if (!postAuthor || !postAuthor.bannedUserIds) {
      return false
    } else {
      return post.user.bannedUserIds.includes(user._id)
    }
  }
  return user && post && !userIsBannedFromPost(user, post) && !userIsBannedFromAllPosts(user, post)
}
