import React from 'react';
import { Comments } from "meteor/example-forum";
import { addCallback, editMutation, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import { preProcessLatex } from '../../editor/server/utils.js';
import htmlToText from 'html-to-text';
import { createError } from 'apollo-errors';

// function commentsSoftRemoveChildrenComments(comment) {
//     const childrenComments = Comments.find({parentCommentId: comment._id}).fetch();
//     childrenComments.forEach(childComment => {
//       editMutation({
//         documentId: childComment._id,
//         set: {deleted:true},
//         unset: {}
//       }).then(()=>console.log('comment softRemoved')).catch(/* error */);
//     });
// }


Comments.convertFromContentAsync = async function(content) {
  content = await preProcessLatex(content);
  return Comments.convertFromContent(content)
}

/*
 * @summary Takes in a content field, returns object with {htmlBody, body, excerpt}
*/

Comments.convertFromContent = (content) => {
  const contentState = convertFromRaw(content);
  return {
    htmlBody: draftToHTML(contentState),
    body: contentState.getPlainText(),
  }
}

/*
 * @summary Input is html, returns object with {body, excerpt}
*/

Comments.convertFromHTML = (html) => {
  const body = htmlToText.fromString(html);
  return {
    body
  }
}

function CommentsEditSoftDeleteCallback (comment, oldComment) {
  if (comment.deleted && !oldComment.deleted) {
    runCallbacksAsync('comments.softDelete.async', comment);
  }
}
addCallback("comments.edit.async", CommentsEditSoftDeleteCallback);

function CommentsNewHTMLSerializeCallback (comment) {
  if (comment.content) {
    const newFields = Comments.convertFromContent(comment.content);
    comment = {...comment, ...newFields}
  } else if (comment.htmlBody) {
    const newFields = Comments.convertFromHTML(comment.content);
    comment = {...comment, ...newFields}
  }
  return comment
}

addCallback("comments.new.sync", CommentsNewHTMLSerializeCallback);

function CommentsEditHTMLSerializeCallback (modifier, comment) {
  if (modifier.$set && modifier.$set.content) {
    const newFields = Comments.convertFromContent(modifier.$set.content)
    modifier.$set = {...modifier.$set, ...newFields}
  } else if (modifier.$set && modifier.$set.htmlBody) {
    const newFields = Comments.convertFromHTML(modifier.$set.htmlBody);
    modifier.$set = {...modifier.$set, ...newFields}
  }
  return modifier
}

addCallback("comments.edit.sync", CommentsEditHTMLSerializeCallback);

function CommentsEmptyCheck (comment, user) {
  if (!convertFromRaw(comment.content).hasText()) {
    const EmptyCommentError = createError('comments.comment_empty_error', {message: 'comments.comment_empty_error'});
    throw new EmptyCommentError({data: {break: true, value: comment}});
  }
  return comment;
}

addCallback("comments.new.validate", CommentsEmptyCheck);
addCallback("comments.edit.validate", CommentsEmptyCheck);


async function CommentsEditHTMLSerializeCallbackAsync (comment) {
  if (comment.content) {
    const newFields = await Comments.convertFromContentAsync(comment.content);
    Comments.update({_id: comment._id}, {$set: newFields})
  } else if (comment.htmlBody) {
    const newFields = Comments.convertFromHTML(comment.content);
    Comments.update({_id: comment._id}, {$set: newFields})
  }
}

addCallback("comments.edit.async", CommentsEditHTMLSerializeCallbackAsync);
addCallback("comments.new.async", CommentsEditHTMLSerializeCallbackAsync);
