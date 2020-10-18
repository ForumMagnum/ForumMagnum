import { forumTypeSetting, siteUrlSetting } from '../../instanceSettings';
import { Utils } from '../../vulcan-lib';
import Users from '../users/collection';
import { Posts, PostsMinimumForGetPageUrl } from './collection';


// EXAMPLE-FORUM Helpers

//////////////////
// Link Helpers //
//////////////////

/**
 * @summary Return a post's link if it has one, else return its post page URL
 * @param {Object} post
 */
Posts.getLink = function (post: PostsBase|DbPost, isAbsolute=false, isRedirected=true): string {
  const url = isRedirected ? Utils.getOutgoingUrl(post.url) : post.url;
  return !!post.url ? url : Posts.getPageUrl(post, isAbsolute);
};

/**
 * @summary Whether a post's link should open in a new tab or not
 * @param {Object} post
 */
Posts.getLinkTarget = function (post: PostsBase|DbPost): string {
  return !!post.url ? '_blank' : '';
};

///////////////////
// Other Helpers //
///////////////////

/**
 * @summary Get a post author's name
 * @param {Object} post
 */
Posts.getAuthorName = function (post: DbPost) {
  var user = Users.findOne(post.userId);
  if (user) {
    return Users.getDisplayName(user);
  } else {
    return post.author;
  }
};

/**
 * @summary Get default status for new posts.
 * @param {Object} user
 */
Posts.getDefaultStatus = function (user: DbUser): number {
  return Posts.config.STATUS_APPROVED;
};

/**
 * @summary Get status name
 * @param {Object} user
 */
Posts.getStatusName = function (post: DbPost): string {
  return Utils.findWhere(Posts.statuses, {value: post.status}).label;
};

/**
 * @summary Check if a post is approved
 * @param {Object} post
 */
Posts.isApproved = function (post: DbPost): boolean {
  return post.status === Posts.config.STATUS_APPROVED;
};

/**
 * @summary Check if a post is pending
 * @param {Object} post
 */
Posts.isPending = function (post: DbPost): boolean {
  return post.status === Posts.config.STATUS_PENDING;
};


/**
 * @summary Get URL for sharing on Twitter.
 * @param {Object} post
 */
Posts.getTwitterShareUrl = (post: DbPost): string => {
  return `https://twitter.com/intent/tweet?text=${ encodeURIComponent(post.title) }%20${ encodeURIComponent(Posts.getLink(post, true)) }`;
};

/**
 * @summary Get URL for sharing on Facebook.
 * @param {Object} post
 */
Posts.getFacebookShareUrl = (post: DbPost): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${ encodeURIComponent(Posts.getLink(post, true)) }`;
};

/**
 * @summary Get URL for sharing by Email.
 * @param {Object} post
 */
Posts.getEmailShareUrl = (post: DbPost): string => {
  const subject = `Interesting link: ${post.title}`;
  const body = `I thought you might find this interesting:

${post.title}
${Posts.getLink(post, true, false)}

(found via ${siteUrlSetting.get()})
  `;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};


// @summary Get URL of a post page.
Posts.getPageUrl = function(post: PostsMinimumForGetPageUrl, isAbsolute=false, sequenceId:string|null=null): string {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  // LESSWRONG – included event and group post urls
  if (sequenceId) {
    return `${prefix}/s/${sequenceId}/p/${post._id}`;
  } else if (post.isEvent) {
    return `${prefix}/events/${post._id}/${post.slug}`;
  } else if (post.groupId) {
    return `${prefix}/g/${post.groupId}/p/${post._id}/`;
  }
  return `${prefix}/posts/${post._id}/${post.slug}`;
};

Posts.getCommentCount = (post: PostsBase|DbPost): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return post.afCommentCount || 0;
  } else {
    return post.commentCount || 0;
  }
}

Posts.getCommentCountStr = (post: PostsBase|DbPost, commentCount?: number|undefined): string => {
  // can be passed in a manual comment count, or retrieve the post's cached comment count

  const count = commentCount != undefined ? commentCount :  Posts.getCommentCount(post)

  if (!count) {
    return "No comments"
  } else if (count == 1) {
    return "1 comment"
  } else {
    return count + " comments"
  }
}


Posts.getLastCommentedAt = (post: PostsBase|DbPost): Date => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return post.afLastCommentedAt;
  } else {
    return post.lastCommentedAt;
  }
}

Posts.getLastCommentPromotedAt = (post: PostsBase|DbPost):Date|null => {
  if (forumTypeSetting.get() === 'AlignmentForum') return null
  // TODO: add an afLastCommentPromotedAt
  return post.lastCommentPromotedAt;
}

Posts.canEdit = (currentUser: UsersCurrent|DbUser|null, post: PostsBase|DbPost): boolean => {
  return Users.owns(currentUser, post) || Users.canDo(currentUser, 'posts.edit.all')
}

Posts.canDelete = (currentUser: UsersCurrent|DbUser|null, post: PostsBase|DbPost): boolean => {
  if (Users.canDo(currentUser, "posts.remove.all")) {
    return true
  }
  return Users.owns(currentUser, post) && post.draft
}

Posts.getKarma = (post: PostsBase|DbPost): number => {
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  return baseScore || 0
}

// User can add/edit the hideCommentKarma setting if:
//  1) The user is logged in and has the requisite setting enabled
//  And
//  2) The post does not exist yet
//  Or if the post does exist
//  3) The post doesn't have any comments yet
Posts.canEditHideCommentKarma = (user: UsersCurrent|DbUser|null, post: PostsBase|DbPost): boolean => {
  return !!(user?.showHideKarmaOption && (!post || !Posts.getCommentCount(post)))
}
