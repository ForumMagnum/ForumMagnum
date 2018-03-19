import { addCallback, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import { preProcessLatex } from '../../editor/server/utils.js';
import Localgroups from '../localgroups/collection.js';

import TurndownService from 'turndown';
const turndownService = new TurndownService()

function PostsEditRunPostUndraftedSyncCallbacks (modifier, post) {
  if (modifier.$set && modifier.$set.draft === false && post.draft) {
    modifier = runCallbacks("posts.undraft.sync", modifier, post);
  }
  return modifier;
}
addCallback("posts.edit.sync", PostsEditRunPostUndraftedSyncCallbacks);

function PostsEditRunPostUndraftedAsyncCallbacks (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
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
  if (post.frontpageDate && !oldPost.frontpageDate) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: 1}})
  }
}
addCallback("posts.edit.async", postsEditIncreaseFrontpagePostCount);

/**
 * @summary update frontpagePostCount when post is moved into frontpage
 */
function postsNewIncreaseFrontpageCount (post) {
  if (post.frontpageDate) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: 1}})
  }
}
addCallback("posts.new.async", postsNewIncreaseFrontpageCount);

/**
 * @summary update frontpagePostCount when post is moved into frontpage
 */
function postsRemoveDecreaseFrontpageCount (post) {
  if (post.frontpageDate) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: -1}})
  }
}
addCallback("posts.remove.async", postsRemoveDecreaseFrontpageCount);

/**
 * @summary update frontpagePostCount when post is moved out of frontpage
 */
function postsEditDecreaseFrontpagePostCount (post, oldPost) {
  if (!post.frontpageDate && oldPost.frontpageDate) {
    Users.update({_id: post.userId}, {$inc: {frontpagePostCount: -1}})
  }
}
addCallback("posts.edit.async", postsEditDecreaseFrontpagePostCount);

Posts.convertFromContentAsync = async function(content) {
  content = await preProcessLatex(content);
  return Posts.convertFromContent(content)
}

/*
 * @summary Takes in a content field, returns object with {htmlBody, body, excerpt}
*/

Posts.convertFromContent = (content) => {
  const contentState = convertFromRaw(content);
  const htmlBody = draftToHTML(contentState)
  const body = turndownService.turndown(htmlBody)
  return {
    htmlBody: htmlBody,
    body: body,
    excerpt: body.slice(0,600),
    wordCount: body.split(" ").length
  }
}

/*
 * @summary Input is html, returns object with {body, excerpt}
*/

Posts.convertFromHTML = (html) => {
  const body = turndownService.turndown(html)
  const excerpt = body.slice(0,600);
  const wordCount = body.split(" ").length
  return {
    body,
    excerpt,
    wordCount
  }
}

function PostsNewHTMLSerializeCallback (post) {
  if (post.content) {
    const newPostFields = Posts.convertFromContent(post.content);
    post = {...post, ...newPostFields}
  } else if (post.htmlBody) {
    const newPostFields = Posts.convertFromHTML(post.htmlBody);
    post = {...post, ...newPostFields}
  }
  return post
}

addCallback("posts.new.sync", PostsNewHTMLSerializeCallback);

function PostsEditHTMLSerializeCallback (modifier, post) {
  if (modifier.$set && modifier.$set.content) {
    const newPostFields = Posts.convertFromContent(modifier.$set.content)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody;
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newPostFields = Posts.convertFromHTML(modifier.$set.htmlBody);
    modifier.$set = {...modifier.$set, ...newPostFields}
  }
  return modifier
}

addCallback("posts.edit.sync", PostsEditHTMLSerializeCallback);

async function PostsEditHTMLSerializeCallbackAsync (post) {
  if (post.content) {
    const newPostFields = await Posts.convertFromContentAsync(post.content);
    Posts.update({_id: post._id}, {$set: newPostFields})
  } else if (post.htmlBody) {
    const newPostFields = Posts.convertFromHTML(post.htmlBody);
    Posts.update({_id: post._id}, {$set: newPostFields})
  }
}

addCallback("posts.edit.async", PostsEditHTMLSerializeCallbackAsync);
addCallback("posts.new.async", PostsEditHTMLSerializeCallbackAsync);

function increaseMaxBaseScore ({newDocument, vote}, collection, user, context) {
  if (vote.collectionName === "Posts" && newDocument.baseScore > (newDocument.maxBaseScore || 0)) {
    Posts.update({_id: newDocument._id}, {$set: {maxBaseScore: newDocument.baseScore}})
  }
}

addCallback("votes.upvote.async", increaseMaxBaseScore);

function PostsNewDefaultLocation (post) {
  if (post.isEvent && post.groupId && !post.location) {
    const { location, googleLocation, mongoLocation } = Localgroups.findOne(post.groupId)
    post = {...post, location, googleLocation, mongoLocation}
  }
  return post
}

addCallback("posts.new.sync", PostsNewDefaultLocation);

function PostsNewDefaultTypes (post) {
  if (post.isEvent && post.groupId && !post.types) {
    const { types } = Localgroups.findOne(post.groupId)
    post = {...post, types}
  }
  return post
}

addCallback("posts.new.sync", PostsNewDefaultTypes);
