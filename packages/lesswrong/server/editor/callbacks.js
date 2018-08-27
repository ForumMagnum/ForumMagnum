import { addCallback } from 'meteor/vulcan:core';
import { Posts, Comments } from 'meteor/example-forum';

async function PostsNewHTMLSerializeCallback (post, author) {
  if (post.content) {
    const newFields = await Posts.convertFromContentAsync(post.content, post._id, post.slug);
    post = {...post, ...newFields}
  } else if (post.body) {
    const newFields = await Posts.convertFromMarkdownAsync(post.body, post._id, post.slug)
    post = {...post, ...newFields}
  } else if (post.htmlBody) {
    const newFields = Posts.convertFromHTML(post.htmlBody, post._id, post.slug, author.isAdmin);
    post = {...post, ...newFields}
  }
  return post
}

addCallback("posts.new.sync", PostsNewHTMLSerializeCallback);

async function CommentsNewHTMLSerializeCallback (comment, author) {
  if (comment.content) {
    const newFields = await Comments.convertFromContentAsync(comment.content);
    comment = {...comment, ...newFields}
  } else if (comment.body) {
    const newFields = await Comments.convertFromMarkdownAsync(comment.body)
    comment = {...comment, ...newFields}
  } else if (comment.htmlBody) {
    const newFields = Comments.convertFromHTML(comment.htmlBody);
    comment = {...comment, ...newFields}
  }
  return comment
}

addCallback("comments.new.sync", CommentsNewHTMLSerializeCallback);

async function PostsEditHTMLSerializeCallback (modifier, post, author) {
  if (modifier.$set && modifier.$set.content) {
    const newFields = await Posts.convertFromContentAsync(modifier.$set.content, post._id, post.slug)
    modifier.$set = {...modifier.$set, ...newFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.body) {
    const newFields = await Posts.convertFromMarkdownAsync(modifier.$set.body, post._id, post.slug)
    modifier.$set = {...modifier.$set, ...newFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newFields = Posts.convertFromHTML(modifier.$set.htmlBody, post._id, post.slug, author.isAdmin);
    modifier.$set = {...modifier.$set, ...newFields}
  }
  return modifier
}

addCallback("posts.edit.sync", PostsEditHTMLSerializeCallback);

async function CommentsEditHTMLSerializeCallback (modifier, comment, author) {
  if (modifier.$set && modifier.$set.content) {
    const newFields = await Comments.convertFromContentAsync(modifier.$set.content)
    modifier.$set = {...modifier.$set, ...newFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.body) {
    const newFields = await Comments.convertFromMarkdownAsync(modifier.$set.body)
    modifier.$set = {...modifier.$set, ...newFields}
    delete modifier.$unset.htmlBody
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newFields = Comments.convertFromHTML(modifier.$set.htmlBody);
    modifier.$set = {...modifier.$set, ...newFields}
  }
  return modifier
}

addCallback("comments.edit.sync", CommentsEditHTMLSerializeCallback);
