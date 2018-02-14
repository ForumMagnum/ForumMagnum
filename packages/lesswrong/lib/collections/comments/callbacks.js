import React from 'react';
import { Comments, Posts } from "meteor/example-forum";
import { addCallback, runCallbacksAsync, newMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import { convertFromRaw, ContentState, convertToRaw } from 'draft-js';
import { draftToHTML } from '../../editor/utils.js';
import { preProcessLatex } from '../../editor/server/utils.js';
import htmlToText from 'html-to-text';
import { createError } from 'apollo-errors';
import Messages from '../messages/collection.js';
import Conversations from '../conversations/collection.js';

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

const getLessWrongAccount = () => {
  let account = Users.findOne({username: "LessWrong"});
  if (!account) {
    const userData = {
      username: "LessWrong",
      email: "lesswrong@lesswrong.com",
    }
    account = newMutation({
      collection: Users,
      userData,
      validate: true
    })
  }
  return account;
}


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

function NewCommentsEmptyCheck (comment, user) {
  if (!comment.htmlBody && !convertFromRaw(comment.content).hasText()) {
    const EmptyCommentError = createError('comments.comment_empty_error', {message: 'comments.comment_empty_error'});
    throw new EmptyCommentError({data: {break: true, value: comment}});
  }
  return comment;
}

function EditCommentsEmptyCheck (modifier, user) {
  const EmptyCommentError = createError('comments.comment_empty_error', {message: 'comments.comment_empty_error'});
  if (modifier && modifier.unset && (modifier.unset.htmlBody || modifier.unset.content)) {
    throw new EmptyCommentError({data: {break: true, value: modifier}});
  }
  if (modifier.set && !modifier.set.htmlBody && !convertFromRaw(modifier.set.content).hasText()) {
    throw new EmptyCommentError({data: {break: true, value: modifier}});
  }
  return modifier;
}

addCallback("comments.new.validate", NewCommentsEmptyCheck);
addCallback("comments.edit.validate", EditCommentsEmptyCheck);


export async function CommentsHTMLSerializeCallbackAsync (comment) {
  if (comment.content) {
    const newFields = await Comments.convertFromContentAsync(comment.content);
    Comments.update({_id: comment._id}, {$set: newFields})
  } else if (comment.htmlBody) {
    const newFields = Comments.convertFromHTML(comment.content);
    Comments.update({_id: comment._id}, {$set: newFields})
  }
}

addCallback("comments.edit.async", CommentsHTMLSerializeCallbackAsync);
addCallback("comments.new.async", CommentsHTMLSerializeCallbackAsync);

export async function CommentsDeleteSendPMAsync (newComment, oldComment, context) {
  if (newComment.deleted && !oldComment.deleted && newComment.content) {
    const originalPost = Posts.findOne(newComment.postId);
    const lwAccount = getLessWrongAccount();

    const conversationData = {
      participantIds: [newComment.userId, lwAccount._id],
      title: `Comment deleted on ${originalPost.title}`
    }
    const conversation = await newMutation({
      collection: Conversations,
      document: conversationData,
      currentUser: lwAccount,
      validate: false,
      context
    });

    console.log("Created conversation", conversation);

    const firstMessageContent =
        `One of your comments on ${originalPost.title} has been removed by the author or a moderator. We've sent you another PM with the content.`

    const firstMessageData = {
      userId: lwAccount._id,
      content: convertToRaw(ContentState.createFromText(firstMessageContent)),
      conversationId: conversation._id
    }

    const secondMessageData = {
      userId: lwAccount._id,
      content: newComment.content,
      conversationId: conversation._id
    }

    newMutation({
      collection: Messages,
      document: firstMessageData,
      currentUser: lwAccount,
      validate: false,
      context
    })

    newMutation({
      collection: Messages,
      document: secondMessageData,
      currentUser: lwAccount,
      validate: false,
      context
    })
  }
}

addCallback("comments.moderate.async", CommentsDeleteSendPMAsync);
