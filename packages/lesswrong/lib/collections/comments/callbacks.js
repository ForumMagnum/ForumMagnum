import React from 'react';
import { Posts } from "../posts";
import { Comments } from './collection'
import { addCallback, runCallbacksAsync, newMutation, editMutation, removeMutation, registerSetting, getSetting } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import { convertFromRaw } from 'draft-js';
import { performVoteServer } from 'meteor/vulcan:voting';
import { createError } from 'apollo-errors';
import Messages from '../messages/collection.js';
import Conversations from '../conversations/collection.js';

import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js'
import { makeEditableOptions } from './custom_fields.js'

const getLessWrongAccount = async () => {
  let account = Users.findOne({username: "LessWrong"});
  if (!account) {
    const userData = {
      username: "LessWrong",
      email: "lesswrong@lesswrong.com",
    }
    account = await newMutation({
      collection: Users,
      document: userData,
      validate: false,
    })
    return account.data
  }
  return account;
}

// EXAMPLE-FORUM CALLBACKS:

//////////////////////////////////////////////////////
// comments.new.sync                                //
//////////////////////////////////////////////////////

function CommentsNewOperations (comment) {

  var userId = comment.userId;

  // increment comment count
  Users.update({_id: userId}, {
    $inc:       {'commentCount': 1}
  });

  // update post
  Posts.update(comment.postId, {
    $inc:       {commentCount: 1},
    $set:       {lastCommentedAt: new Date()},
    $addToSet:  {commenters: userId}
  });

  return comment;
}
addCallback('comments.new.sync', CommentsNewOperations);

//////////////////////////////////////////////////////
// comments.new.async                               //
//////////////////////////////////////////////////////


/**
 * @summary Run the 'upvote.async' callbacks *once* the item exists in the database
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 */
function UpvoteAsyncCallbacksAfterDocumentInsert(item, user, collection) {
  runCallbacksAsync('upvote.async', item, user, collection, 'upvote');
}

addCallback('comments.new.async', UpvoteAsyncCallbacksAfterDocumentInsert);

//////////////////////////////////////////////////////
// comments.remove.async                            //
//////////////////////////////////////////////////////

function CommentsRemovePostCommenters (comment, currentUser) {
  const { userId, postId } = comment;

  // dec user's comment count
  Users.update({_id: userId}, {
    $inc: {'commentCount': -1}
  });

  const postComments = Comments.find({postId}, {sort: {postedAt: -1}}).fetch();

  const commenters = _.uniq(postComments.map(comment => comment.userId));
  const lastCommentedAt = postComments[0] && postComments[0].postedAt;

  // update post with a decremented comment count, a unique list of commenters and corresponding last commented at date
  Posts.update(postId, {
    $inc: {commentCount: -1},
    $set: {lastCommentedAt, commenters},
  });

  return comment;
}

addCallback('comments.remove.async', CommentsRemovePostCommenters);

function CommentsRemoveChildrenComments (comment, currentUser) {

  const childrenComments = Comments.find({parentCommentId: comment._id}).fetch();

  childrenComments.forEach(childComment => {
    removeMutation({
      action: 'comments.remove',
      collection: Comments,
      documentId: childComment._id,
      currentUser: currentUser,
      validate: false
    });
  });

  return comment;
}

addCallback('comments.remove.async', CommentsRemoveChildrenComments);

//////////////////////////////////////////////////////
// other                                            //
//////////////////////////////////////////////////////

function UsersRemoveDeleteComments (user, options) {
  if (options.deleteComments) {
    Comments.remove({userId: user._id});
  } else {
    // not sure if anything should be done in that scenario yet
    // Comments.update({userId: userId}, {$set: {author: '\[deleted\]'}}, {multi: true});
  }
}
addCallback('users.remove.async', UsersRemoveDeleteComments);

registerSetting('forum.commentInterval', 15, 'How long users should wait in between comments (in seconds)');

function CommentsNewRateLimit (comment, user) {
  if (!Users.isAdmin(user)) {
    const timeSinceLastComment = Users.timeSinceLast(user, Comments);
    const commentInterval = Math.abs(parseInt(getSetting('forum.commentInterval',15)));

    // check that user waits more than 15 seconds between comments
    if((timeSinceLastComment < commentInterval)) {
      throw new Error(Utils.encodeIntlError({id: 'comments.rate_limit_error', value: commentInterval-timeSinceLastComment}));
    }
  }
  return comment;
}
addCallback('comments.new.validate', CommentsNewRateLimit);


// LESSWRONG CALLBACKS

function CommentsEditSoftDeleteCallback (comment, oldComment) {
  if (comment.deleted && !oldComment.deleted) {
    runCallbacksAsync('comments.moderate.async', comment);
  }
}
addCallback("comments.edit.async", CommentsEditSoftDeleteCallback);


function ModerateCommentsPostUpdate (comment, oldComment) {
  const comments = Comments.find({postId:comment.postId, deleted: {$ne: true}}).fetch()

  const lastComment = _.max(comments, (c) => c.postedAt)
  const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:comment.postId}).postedAt

  editMutation({
    collection:Posts,
    documentId: comment.postId,
    set: {
      lastCommentedAt:new Date(lastCommentedAt),
      commentCount:comments.length
    },
    unset: {}
  })
}
addCallback("comments.moderate.async", ModerateCommentsPostUpdate);

function NewCommentsEmptyCheck (comment, user) {
  if (!comment.htmlBody &&
      !comment.body &&
      (!comment.content || !convertFromRaw(comment.content).hasText())) {
    const EmptyCommentError = createError('comments.comment_empty_error', {message: 'comments.comment_empty_error'});
    throw new EmptyCommentError({data: {break: true, value: comment}});
  }
  return comment;
}

addCallback("comments.new.validate", NewCommentsEmptyCheck);

export async function CommentsDeleteSendPMAsync (newComment, oldComment, context) {
  if (newComment.deleted && !oldComment.deleted && newComment.htmlBody) {
    const originalPost = Posts.findOne(newComment.postId);
    const moderatingUser = Users.findOne(newComment.deletedByUserId);
    const lwAccount = await getLessWrongAccount();

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

    let firstMessageContent =
        `One of your comments on "${originalPost.title}" has been removed by ${moderatingUser.displayName}. We've sent you another PM with the content.`
    if (newComment.deletedReason) {
      firstMessageContent += ` They gave the following reason: "${newComment.deletedReason}".`;
    }

    const firstMessageData = {
      userId: lwAccount._id,
      htmlBody: firstMessageContent,
      conversationId: conversation.data._id
    }

    const secondMessageData = {
      userId: lwAccount._id,
      htmlBody: newComment.htmlBody,
      conversationId: conversation.data._id
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

/**
 * @summary Make users upvote their own new comments
 */

 // LESSWRONG – bigUpvote
async function LWCommentsNewUpvoteOwnComment(comment) {
  var commentAuthor = Users.findOne(comment.userId);
  const votedComment = await performVoteServer({ document: comment, voteType: 'smallUpvote', collection: Comments, user: commentAuthor })
  return {...comment, ...votedComment};
}

addCallback('comments.new.after', LWCommentsNewUpvoteOwnComment);

function NewCommentNeedsReview (comment) {
  const user = Users.findOne({_id:comment.userId})
  const karma = user.karma || 0
  if (karma < 100) {
    Comments.update({_id:comment._id}, {$set: {needsReview: true}});
  }
}
addCallback("comments.new.async", NewCommentNeedsReview);

addEditableCallbacks({collection: Comments, options: makeEditableOptions})
