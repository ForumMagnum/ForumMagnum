import { forumTypeSetting } from '../../instanceSettings';
import { Utils } from '../../vulcan-lib';
import { Posts } from '../posts/collection';
import { postGetPageUrl } from '../posts/helpers';
import Users from "../users/collection";
import { Comments } from './collection';
import { Tags } from '../tags/collection';


/**
 * @summary Get a comment author's name
 * @param {Object} comment
 */
Comments.getAuthorName = function (comment: DbComment): string {
  var user = Users.findOne(comment.userId);
  return user ? Users.getDisplayName(user) : comment.author;
};

/**
 * @summary Get URL of a comment page.
 * @param {Object} comment
 */
// LW: Overwrite the original example-forum Comments.getPageUrl
Comments.getPageUrl = function(comment: CommentsList|DbComment, isAbsolute = false): string {
  if (comment.postId) {
    const post = Posts.findOne(comment.postId);
    if (!post) throw Error(`Unable to find post for comment: ${comment}`)
    return `${postGetPageUrl(post, isAbsolute)}?commentId=${comment._id}`;
  } else if (comment.tagId) {
    const tag = Tags.findOne(comment.tagId);
    if (!tag) throw Error(`Unable to find tag for comment: ${comment}`)
    return `/tag/${tag.slug}/discussion#${comment._id}`;
  } else {
    throw Error(`Unable to find document for comment: ${comment}`)
  }
};

Comments.getPageUrlFromIds = function({postId, postSlug, tagSlug, commentId, permalink=true, isAbsolute=false}: {
  postId?: string,
  postSlug?: string,
  tagSlug?: string,
  commentId: string,
  permalink: boolean, isAbsolute: boolean,
}): string {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  if (postId) {
    if (permalink) {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}?commentId=${commentId}`;
    } else {
      return `${prefix}/posts/${postId}/${postSlug?postSlug:""}#${commentId}`;
    }
  } else if (tagSlug) {
    return `${prefix}/tag/${tagSlug}/discussion#${commentId}`;
  } else {
    //throw new Error("Comments.getPageUrlFromIds needs a post or tag");
    return "/"
  }
}

// URL for RSS feed of all direct replies
Comments.getRSSUrl = function(comment: HasIdType, isAbsolute = false): string {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/feed.xml?type=comments&view=commentReplies&parentCommentId=${comment._id}`;
};

Comments.defaultToAlignment = (currentUser: UsersCurrent|null, post: PostsMinimumInfo|undefined, comment?: CommentsList): boolean => {
  if (forumTypeSetting.get() === 'AlignmentForum') { return true }
  if (comment) {
    return !!(Users.canDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return !!(Users.canDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

Comments.getDefaultView = (post: PostsDetails|DbPost|null, currentUser: UsersCurrent|null): string => {
  return (post?.commentSortOrder) || (currentUser?.commentSorting) || "postCommentsTop"
}

Comments.getKarma = (comment: CommentsList|DbComment): number => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? comment.afBaseScore : comment.baseScore
  return baseScore || 0
}
