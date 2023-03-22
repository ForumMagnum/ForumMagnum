import { postCoauthorIsPending } from "../../lib/collections/posts/helpers";

export const usePostsUserAndCoauthors = (post: PostsList|SunshinePostsList) => {
  const isAnon = !post.user || !!post.hideAuthor;

  let topCommentAuthor = post.question
    ? post.bestAnswer?.user
    : post.lastPromotedComment?.user;
  if (topCommentAuthor === post.user?._id) {
    topCommentAuthor = null;
  }

  const coauthors = post.coauthors.filter(({_id}) => !postCoauthorIsPending(post, _id));
  const authors = [post.user, ...coauthors].filter(
    (user) => !!user,
  ) as UsersMinimumInfo[]; // ts isn't smart enough to realise we're filtering nulls

  return {
    isAnon,
    topCommentAuthor,
    authors,
  };
}
