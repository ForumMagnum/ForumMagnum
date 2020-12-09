import { forumTypeSetting } from '../../instanceSettings';
import { getSiteUrl } from '../../vulcan-lib/utils';
import { mongoFindOne } from '../../mongoQueries';
import { postGetPageUrl } from '../posts/helpers';
import { userCanDo } from '../../vulcan-users/permissions';
import { userGetDisplayName } from "../users/helpers";


// Get a comment author's name
export function commentGetAuthorName(comment: DbComment): string {
  var user = mongoFindOne("Users", comment.userId);
  return user ? userGetDisplayName(user) : comment.author;
};

// Get URL of a comment page.
export function commentGetPageUrl(comment: CommentsList|DbComment, isAbsolute = false): string {
  if (comment.postId) {
    const post = mongoFindOne("Posts", comment.postId);
    if (!post) throw Error(`Unable to find post for comment: ${comment}`)
    return `${postGetPageUrl(post, isAbsolute)}?commentId=${comment._id}`;
  } else if (comment.tagId) {
    const tag = mongoFindOne("Tags", {_id:comment.tagId});
    if (!tag) throw Error(`Unable to find tag for comment: ${comment}`)
    return `/tag/${tag.slug}/discussion#${comment._id}`;
  } else {
    throw Error(`Unable to find document for comment: ${comment}`)
  }
};

export function commentGetPageUrlFromIds({postId, postSlug, tagSlug, commentId, permalink=true, isAbsolute=false}: {
  postId?: string,
  postSlug?: string,
  tagSlug?: string,
  commentId: string,
  permalink?: boolean, isAbsolute?: boolean,
}): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  if (postId) {
    if (permalink) {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}?commentId=${commentId}`;
    } else {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}#${commentId}`;
    }
  } else if (tagSlug) {
    return `${prefix}/tag/${tagSlug}/discussion#${commentId}`;
  } else {
    //throw new Error("commentGetPageUrlFromIds needs a post or tag");
    return "/"
  }
}

// URL for RSS feed of all direct replies
export const commentGetRSSUrl = function(comment: HasIdType, isAbsolute = false): string {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/feed.xml?type=comments&view=commentReplies&parentCommentId=${comment._id}`;
};

export const commentDefaultToAlignment = (currentUser: UsersCurrent|null, post: PostsMinimumInfo|undefined, comment?: CommentsList): boolean => {
  if (forumTypeSetting.get() === 'AlignmentForum') { return true }
  if (comment) {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return !!(userCanDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

export const commentGetDefaultView = (post: PostsDetails|DbPost|null, currentUser: UsersCurrent|null): string => {
  return (post?.commentSortOrder) || (currentUser?.commentSorting) || "postCommentsTop"
}

export const commentGetKarma = (comment: CommentsList|DbComment): number => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? comment.afBaseScore : comment.baseScore
  return baseScore || 0
}
