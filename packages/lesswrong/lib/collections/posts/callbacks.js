import { addCallback, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import { updateScore } from 'meteor/vulcan:voting';
import Users from 'meteor/vulcan:users';

import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import htmlToText from 'html-to-text';

function PostsEditRunPostUndraftedSyncCallbacks (modifier, post) {
  if (modifier.$set && modifier.$set.draft === false && post.draft) {
    modifier = runCallbacks("posts.undraft.sync", modifier, post);
  }
  return modifier;
}
addCallback("posts.edit.sync", PostsEditRunPostUndraftedSyncCallbacks);

function PostsEditRunPostUndraftedAsyncCallbacks (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
    console.log("Running undraft async callback");
    runCallbacksAsync("posts.undraft.async", newPost, oldPost)
  }
  return newPost
}

addCallback("posts.edit.async", PostsEditRunPostUndraftedAsyncCallbacks);

/**
 * @summary set postedAt when a post is moved out of drafts
 */
function PostsSetPostedAt (modifier, post) {
  modifier.$set.postedAt = new Date();
  if (modifier.$unset) {
    delete modifier.$unset.postedAt;
  }
  return modifier;
}
addCallback("posts.undraft.sync", PostsSetPostedAt);

/**
 * @summary update frontpagePostCount when post is moved into frontpage
 */
function postsEditIncreaseFrontpagePostCount (post, oldPost) {
  if (post.frontpage && !oldPost.frontpage) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: 1}})
  }
}
addCallback("posts.edit.async", postsEditIncreaseFrontpagePostCount);

/**
 * @summary update frontpagePostCount when post is moved into frontpage
 */
function postsNewIncreaseFrontpageCount (post) {
  if (post.frontpage) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: 1}})
  }
}
addCallback("posts.new.async", postsNewIncreaseFrontpageCount);

/**
 * @summary update frontpagePostCount when post is moved into frontpage
 */
function postsRemoveDecreaseFrontpageCount (post) {
  if (post.frontpage) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: -1}})
  }
}
addCallback("posts.remove.async", postsRemoveDecreaseFrontpageCount);

/**
 * @summary update frontpagePostCount when post is moved out of frontpage
 */
function postsEditDecreaseFrontpagePostCount (post, oldPost) {
  if (!post.frontpage && oldPost.frontpage) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: -1}})
  }
}
addCallback("posts.edit.async", postsEditDecreaseFrontpagePostCount);

function PostsNewHTMLSerializeCallback (post) {
  if (post.content) {
    const contentState = convertFromRaw(post.content);
    const html = draftToHTML(contentState);
    post.htmlBody = html;
    post.body = contentState.getPlainText();
    post.excerpt = post.body.slice(0,140);
    console.log("Comments New HTML serialization", post.excerpt)
  } else if (post.htmlBody) {
    post.body = htmlToText.fromString(post.htmlBody);
    post.excerpt = post.body.slice(0,140);
  }
  return post
}

addCallback("posts.new.sync", PostsNewHTMLSerializeCallback);

function PostsEditHTMLSerializeCallback (modifier, post) {
  if (modifier.$set && modifier.$set.content) {
    const contentState = convertFromRaw(modifier.$set.content);
    console.log("Comment Edit callback: ", modifier.$set.content);
    modifier.$set.htmlBody = draftToHTML(contentState);
    modifier.$set.body = contentState.getPlainText();
    modifier.$set.excerpt = modifier.$set.body.slice(0,140);
    console.log("Comments Edit HTML serialization", modifier.$set.htmlBody, modifier.$set.body)
  } else if (modifier.$set && modifier.$set.htmlBody) {
    modifier.$set.body = htmlToText.fromString(modifier.$set.htmlBody);
    modifier.$set.exerpt = modifier.$set.body.slice(0,140);
  }
  return modifier
}

addCallback("posts.edit.sync", PostsEditHTMLSerializeCallback);
