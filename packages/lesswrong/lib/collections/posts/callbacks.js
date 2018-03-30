import { addCallback, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import { preProcessLatex } from '../../editor/server/utils.js';
import Localgroups from '../localgroups/collection.js';

import marked from 'marked';
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
  const contentState = convertFromRaw(await preProcessLatex(content));
  return {htmlBody: draftToHTML(contentState)}
}

Posts.createHtmlHighlight = (body, id, slug, wordCount) => {
  const highlight = body.replace(/< refresh to render LaTeX >/g, "< LaTeX Equation >")

  if (body.length > 1800) {
    // drop the last paragraph
    const highlightShortened = highlight.slice(0,2200).split("\n\n").slice(0,-1).join("\n\n")
    const highlightWordCount = highlightShortened.split(" ").length
    const highlightWithContinue = highlightShortened + `... <div class="post-highlight-continue-reading">[(Continue, ${wordCount-highlightWordCount} more words)](/posts/${id}/${slug})</div>`
    return marked(highlightWithContinue)
  } else {
    return marked(highlight)
  }
}

Posts.createExcerpt = (body) => {
  let excerpt = body.slice(0,300)
  excerpt += `... <span class="post-excerpt-read-more">(Read More)</span>`
  return marked(excerpt)
}

/*ws
 * @summary Takes in a content field, returns object with {htmlBody, body, excerpt}
*/

Posts.convertFromContent = (content, id, slug) => {
  const contentState = convertFromRaw(content);
  const htmlBody = draftToHTML(contentState)
  const body = turndownService.turndown(htmlBody)
  const excerpt = Posts.createExcerpt(body)
  const wordCount = body.split(" ").length
  const htmlHighlight = Posts.createHtmlHighlight(body, id, slug, wordCount)
  return {
    htmlBody: htmlBody,
    body: body,
    excerpt: excerpt,
    htmlHighlight: htmlHighlight,
    wordCount: wordCount
  }
}

/*
 * @summary Input is html, returns object with {body, excerpt}
*/

Posts.convertFromHTML = (html, id, slug) => {
  const body = turndownService.turndown(html)
  const excerpt = Posts.createExcerpt(body)
  const wordCount = body.split(" ").length
  const htmlHighlight = Posts.createHtmlHighlight(body, id, slug, wordCount)
  return {
    body,
    excerpt,
    wordCount,
    htmlHighlight
  }
}

function PostsNewHTMLSerializeCallback (post) {
  if (post.content) {
    const newPostFields = Posts.convertFromContent(post.content, post._id, post.slug);
    post = {...post, ...newPostFields}
  } else if (post.htmlBody) {
    const newPostFields = Posts.convertFromHTML(post.htmlBody, post._id, post.slug);
    post = {...post, ...newPostFields}
  }
  return post
}

addCallback("posts.new.sync", PostsNewHTMLSerializeCallback);

function PostsEditHTMLSerializeCallback (modifier, post) {
  if (modifier.$set && modifier.$set.content) {
    const newPostFields = Posts.convertFromContent(modifier.$set.content, post._id, post.slug)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody;
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newPostFields = Posts.convertFromHTML(modifier.$set.htmlBody, post._id, post.slug);
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
    const newPostFields = Posts.convertFromHTML(post.htmlBody, post._id, post.slug);
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
