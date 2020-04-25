import { forumTypeSetting } from '../../instanceSettings';
import { Utils } from '../../vulcan-lib';
import { Posts } from '../posts';
import Users from "../users/collection";
import { Comments } from './collection';


/**
 * @summary Get a comment author's name
 * @param {Object} comment
 */
Comments.getAuthorName = function (comment) {
  var user = Users.findOne(comment.userId);
  return user ? Users.getDisplayName(user) : comment.author;
};

/**
 * @summary Get URL of a comment page.
 * @param {Object} comment
 */
// LW: Overwrite the original example-forum Comments.getPageUrl
Comments.getPageUrl = function(comment, isAbsolute = false) {
  const post = Posts.findOne(comment.postId);
  return `${Posts.getPageUrl(post, isAbsolute)}?commentId=${comment._id}`;
};

Comments.getPageUrlFromIds = function({postId, postSlug, commentId, permalink=true, isAbsolute=false}) {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  if (permalink) {
    return `${prefix}/posts/${postId}/${postSlug?postSlug:""}?commentId=${commentId}`;
  } else {
    return `${prefix}/posts/${postId}/${postSlug?postSlug:""}#${commentId}`;
  }
}

// URL for RSS feed of all direct replies
Comments.getRSSUrl = function(comment, isAbsolute = false) {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/feed.xml?type=comments&view=commentReplies&parentCommentId=${comment._id}`;
};

Comments.defaultToAlignment = (currentUser, post, comment) => {
  if (forumTypeSetting.get() === 'AlignmentForum') { return true }
  if (comment) {
    return (Users.canDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return (Users.canDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

Comments.getDefaultView = (post, currentUser) => {
  return (post && post.commentSortOrder) || (currentUser && currentUser.commentSorting) || "postCommentsTop"
}

Comments.getKarma = (comment) => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? comment.afBaseScore : comment.baseScore
  return baseScore || 0
}
