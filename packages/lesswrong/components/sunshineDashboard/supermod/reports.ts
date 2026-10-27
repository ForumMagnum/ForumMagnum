import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';

export interface ReportSubject {
  kind: 'Post' | 'Comment' | 'User';
  title: string;
  url: string;
  /** The author of the reported content, or the reported user */
  author: UsersMinimumInfo | null;
}

export function getReportSubject({ post, comment, reportedUser, link }: UnclaimedReportsList): ReportSubject {
  if (comment) {
    return {
      kind: 'Comment',
      title: `Comment on ${comment.post?.title ?? comment.tag?.name ?? 'unknown post'}`,
      url: commentGetPageUrlFromIds({
        postId: comment.postId,
        postSlug: comment.post?.slug,
        tagSlug: comment.tag?.slug,
        tagCommentType: comment.tagCommentType,
        commentId: comment._id,
      }),
      author: comment.user,
    };
  }
  if (post) {
    return {
      kind: 'Post',
      title: post.title,
      url: postGetPageUrl(post),
      author: post.user,
    };
  }
  return {
    kind: 'User',
    title: reportedUser ? `User: ${reportedUser.displayName}` : 'Reported user',
    url: reportedUser ? userGetProfileUrl(reportedUser) : link,
    author: reportedUser,
  };
}
