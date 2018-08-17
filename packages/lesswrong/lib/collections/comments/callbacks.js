import React from 'react';
import { Comments, Posts } from "meteor/example-forum";
import { addCallback, removeCallback, runCallbacksAsync, newMutation, editMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import { convertFromRaw, ContentState, convertToRaw } from 'draft-js';
import { performVoteServer } from 'meteor/vulcan:voting';

import { createError } from 'apollo-errors';
import Messages from '../messages/collection.js';
import Conversations from '../conversations/collection.js';

const getLessWrongAccount = async () => {
  let account = Users.findOne({username: "StaffForumRoot"});
  if (!account) {
    const userData = {
      // TODO nicer solution
      username: "StaffForumRoot",
      email: "jp+lesswrongaccount@centreforeffectivealtruism.org",
    }
    account = await newMutation({
      collection: Users,
      document: userData,
      validate: false,
    })
  }
  return account;
}

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
  if (newComment.deleted && !oldComment.deleted && newComment.content) {
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

//LESSWRONG: Remove original LWCommentsNewUpvoteOwnComment from Vulcan
removeCallback('comments.new.after', 'CommentsNewUpvoteOwnComment');

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

//TODO: Probably change these to take a boolean argument?
const updateParentsSetAFtrue = (comment) => {
  Comments.update({_id:comment.parentCommentId}, {$set: {af: true}});
  const parent = Comments.findOne({_id: comment.parentCommentId});
  if (parent) {
    updateParentsSetAFtrue(parent)
  }
}

const updateChildrenSetAFfalse = (comment) => {
  const children = Comments.find({parentCommentId: comment._id}).fetch();
  children.forEach((child)=> {
    Comments.update({_id:child._id}, {$set: {af: false}});
    updateChildrenSetAFfalse(child)
  })
}

function CommentsAlignmentEdit (comment, oldComment) {
  if (comment.af && !oldComment.af) {
    updateParentsSetAFtrue(comment);
  }
  if (!comment.af && oldComment.af) {
    updateChildrenSetAFfalse(comment);
  }
}
addCallback("comments.edit.async", CommentsAlignmentEdit);
addCallback("comments.alignment.async", CommentsAlignmentEdit);


function CommentsAlignmentNew (comment) {
  if (comment.af) {
    updateParentsSetAFtrue(comment);
  }
}
addCallback("comments.new.async", CommentsAlignmentNew);

function NewCommentNeedsReview (comment) {
  const user = Users.findOne({_id:comment.userId})
  if (user.karma < 100) {
    Comments.update({_id:comment._id}, {$set: {needsReview: true}});
  }
}
addCallback("comments.new.async", NewCommentNeedsReview);
