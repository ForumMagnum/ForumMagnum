export const usePostsUserAndCoauthors = (post: PostsList|SunshinePostsList|PostsBestOfList) => {
  const isAnon = !post.user || !!post.hideAuthor;

  let topCommentAuthor = post.question
    ? post.bestAnswer?.user
    : post.lastPromotedComment?.user;
  if (topCommentAuthor === post.user?._id) {
    topCommentAuthor = null;
  }

  const authors = [post.user, ...(post.coauthors ?? [])].filter(
    (user): user is UsersMinimumInfo => !!user,
  );

  return {
    isAnon,
    topCommentAuthor,
    authors,
  };
}
