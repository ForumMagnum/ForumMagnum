import { postCoauthorIsPending } from "../../lib/collections/posts/helpers";

function getPostAuthors(post: ValidPostFragments) {
  const coauthors = post.coauthors?.filter(({_id}) => !postCoauthorIsPending(post, _id)) ?? [];
  return [post.user, ...coauthors].filter(
    (user): user is UsersMinimumInfo => !!user,
  );
}

type ValidPostFragments = PostsList | SunshinePostsList | PostsBestOfList | PostsTopItemInfo;

interface AuthorInfo {
  isAnon: boolean;
  topCommentAuthor?: UsersMinimumInfo | null;
  authors: UsersMinimumInfo[]
}

export const usePostsUserAndCoauthors = <T extends ValidPostFragments>(post: T): AuthorInfo => {
  if (!('hideAuthor' in post)) {
    return {
      isAnon: false,
      topCommentAuthor: null,
      authors: getPostAuthors(post)
    };
  }

  const isAnon = !post.user || !!post.hideAuthor;

  let topCommentAuthor = post.question
    ? post.bestAnswer?.user
    : post.lastPromotedComment?.user;
  if (topCommentAuthor === post.user?._id) {
    topCommentAuthor = null;
  }

  const authors = getPostAuthors(post);

  return {
    isAnon,
    topCommentAuthor,
    authors,
  };
}
