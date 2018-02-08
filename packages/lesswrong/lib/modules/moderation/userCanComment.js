
export const userCanComment = (user, post) => {
  const userIsBannedFromPost = (user, post) => {
    if (!post.bannedUserIds) {
      return false
    } else {
      return post.bannedUserIds.includes(user._id)
    }
  }
  const userIsBannedFromAllPosts = (user, post) => {
    if (!post.user || !post.user.bannedUserIds) {
      return false
    } else {
      return post.user.bannedUserIds.includes(user._id)
    }
  }
  const output = user && post && !userIsBannedFromPost(user, post) && !userIsBannedFromAllPosts(user, post)
  console.log(output, userIsBannedFromPost(user, post), userIsBannedFromAllPosts(user, post))
  return output
}
