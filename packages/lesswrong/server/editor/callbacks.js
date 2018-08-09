import { addCallback } from 'meteor/vulcan:core';
import { Posts, Comments } from 'meteor/example-forum';

function PostsNewHTMLSerializeCallback (post) {
  if (post.content) {
    const newPostFields = Posts.convertFromContent(post.content, post._id, post.slug);
    post = {...post, ...newPostFields}
  } else if (post.body) {
    const newPostFields = Posts.convertFromMarkdown(post.body, post._id, post.slug)
    post = {...post, ...newPostFields}
  } else if (post.htmlBody) {
    const newPostFields = Posts.convertFromHTML(post.htmlBody, post._id, post.slug);
    post = {...post, ...newPostFields}
  }
  return post
}

addCallback("posts.new.sync", PostsNewHTMLSerializeCallback);

function CommentsNewHTMLSerializeCallback (comment) {
  if (comment.content) {
    const newPostFields = Posts.convertFromContent(comment.content);
    comment = {...comment, ...newPostFields}
  } else if (comment.body) {
    const newPostFields = Posts.convertFromMarkdown(comment.body)
    comment = {...comment, ...newPostFields}
  } else if (comment.htmlBody) {
    const newPostFields = Posts.convertFromHTML(comment.htmlBody);
    comment = {...comment, ...newPostFields}
  }
  return comment
}

addCallback("comments.new.sync", CommentsNewHTMLSerializeCallback);

function PostsEditHTMLSerializeCallback (modifier, post) {
  if (modifier.$set && modifier.$set.content) {
    const newPostFields = Posts.convertFromContent(modifier.$set.content, post._id, post.slug)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.body) {
    const newPostFields = Posts.convertFromMarkdown(modifier.$set.body, post._id, post.slug)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newPostFields = Posts.convertFromHTML(modifier.$set.htmlBody, post._id, post.slug);
    modifier.$set = {...modifier.$set, ...newPostFields}
  }
  return modifier
}

addCallback("posts.edit.sync", PostsEditHTMLSerializeCallback);

function CommentsEditHTMLSerializeCallback (modifier, comment) {
  if (modifier.$set && modifier.$set.content) {
    const newPostFields = Comments.convertFromContent(modifier.$set.content)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.body) {
    const newPostFields = Comments.convertFromMarkdown(modifier.$set.body)
    modifier.$set = {...modifier.$set, ...newPostFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newPostFields = Comments.convertFromHTML(modifier.$set.htmlBody);
    modifier.$set = {...modifier.$set, ...newPostFields}
  }
  return modifier
}

addCallback("comments.edit.sync", CommentsEditHTMLSerializeCallback);


async function PostsHTMLSerializeCallbackAsync (newPost, oldPost) {
  let newPostFields = {}

  if (newPost.content !== oldPost.content) {
    newPostFields = await Posts.convertFromContentAsync(newPost.content);
  } else if (newPost.body !== oldPost.body) {
    newPostFields = await Posts.convertFromMarkdownAsync(newPost.body, newPost._id, newPost.slug)
  } else if (newPost.htmlBody !== oldPost.htmlBody) {
    newPostFields = Posts.convertFromHTML(newPost.htmlBody, newPost._id, newPost.slug);
  }

  if (newPostFields) {
    Posts.update({_id: newPost._id}, {$set: newPostFields})
  }
}

addCallback("posts.edit.async", PostsHTMLSerializeCallbackAsync);
addCallback("posts.new.async", PostsHTMLSerializeCallbackAsync);

export async function CommentsHTMLSerializeCallbackAsync (newComment, oldComment) {
  let newFields = {}

  if (newComment.content !== oldComment.content) {
    newFields = await Comments.convertFromContentAsync(newComment.content);
  } else if (newComment.body !== oldComment.body) {
    newFields = await Comments.convertFromMarkdownAsync(newComment.body)
  } else if (newComment.htmlBody !== oldComment.htmlBody) {
    newFields = Comments.convertFromHTML(newComment.htmlBody);
  }

  if (newFields) {
    Comments.update({_id: newComment._id}, {$set: newFields})
  }
}

addCallback("comments.edit.async", CommentsHTMLSerializeCallbackAsync);
addCallback("comments.new.async", CommentsHTMLSerializeCallbackAsync);
