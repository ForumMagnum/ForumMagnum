import { Posts } from 'meteor/example-forum';
import { Utils } from 'meteor/vulcan:core';

/**
 * @summary Get URL of a post page.
 * @param {Object} post
 */
Posts.getPageUrl = function(post, isAbsolute = false){
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  // LESSWRONG – included event and group post urls
  if (post.isEvent) {
    return `${prefix}/events/${post._id}/${post.slug}`;
  }
  if (post.groupId) {
    return `${prefix}/g/${post.groupId}/p/${post._id}/`;
  }
  return `${prefix}/posts/${post._id}/${post.slug}`;
};
