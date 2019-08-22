import { Posts } from '../posts'
import { Comments } from './collection.js'
import Users from "meteor/vulcan:users"
import { getSetting } from 'meteor/vulcan:core'
import { accessFilterMultiple } from '../../modules/utils/schemaUtils'
import moment from 'moment';

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
  return `${Posts.getPageUrl(post, isAbsolute)}#${comment._id}`;
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
  if (getSetting('forumType') === 'AlignmentForum') { return true }
  if (comment) {
    return (Users.canDo(currentUser, "comments.alignment.new") && post?.af && comment.af)
  } else {
    return (Users.canDo(currentUser, "comments.alignment.new") && post?.af)
  }
}

Comments.getDefaultView = (post, currentUser) => {
  return (post && post.commentSortOrder) || (currentUser && currentUser.commentSorting) || "postCommentsTop"
}

Comments.getLatest = async ({ post, currentUser, commentsLimit, maxAgeHours, af}) => {
  const timeCutoff = moment().subtract(maxAgeHours, 'hours').toDate();
  const comments = Comments.find({
    ...Comments.defaultView({}).selector,
    postId: post._id,
    score: {$gt:0},
    deletedPublic: false,
    postedAt: {$gt: timeCutoff},
    ...(af ? {af:true} : {}),
  }, {
    limit: commentsLimit,
    sort: {postedAt:-1}
  }).fetch();

  const topLevelCommentIds = _.uniq(comments.map((comment)=>comment.topLevelCommentId))
  const commentIds = comments.map((comment)=>comment._id)
  const newTopLevelCommentIds = _.difference(topLevelCommentIds, commentIds)
  const newTopLevelComments = Comments.find({_id:{$in: newTopLevelCommentIds}}).fetch()

  return accessFilterMultiple(currentUser, Comments, [...comments, ...newTopLevelComments]);
}