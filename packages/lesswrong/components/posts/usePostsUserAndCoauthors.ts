import { useCurrentUserId } from "../common/withUser";

export interface PostAuthorVisibilityInfo {
  draft?: boolean | null,
  userId?: string | null,
  coauthorUserIds?: string[] | null,
}

export const currentUserCanSeeDraftAuthorNames = (
  currentUserId: string | null | undefined,
  post: PostAuthorVisibilityInfo,
): boolean => {
  return !!(
    post.draft
    && currentUserId
    && (post.userId === currentUserId || post.coauthorUserIds?.includes(currentUserId))
  );
}

export const usePostsUserAndCoauthors = (post: PostsList|SunshinePostsList|PostsBestOfList) => {
  const currentUserId = useCurrentUserId();
  const isAnon = !post.user || !!post.hideAuthor;
  const disableNoKibitz = currentUserCanSeeDraftAuthorNames(currentUserId, post);

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
    disableNoKibitz,
  };
}
