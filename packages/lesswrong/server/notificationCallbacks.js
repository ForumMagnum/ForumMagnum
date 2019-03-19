import Notifications from '../lib/collections/notifications/collection.js';
import Messages from '../lib/collections/messages/collection.js';
import Conversations from '../lib/collections/conversations/collection.js';

import Localgroups from '../lib/collections/localgroups/collection.js';
import Users from 'meteor/vulcan:users';
import { Posts } from '../lib/collections/posts';
import { Comments } from '../lib/collections/comments'
import { renderAndSendEmail, reasonUserCantReceiveEmails } from './emails/renderEmail.js';
import './emailComponents/EmailWrapper.jsx';
import './emailComponents/NewPostEmail.jsx';

import { addCallback, newMutation } from 'meteor/vulcan:core';

import { Components } from 'meteor/vulcan:core';
import React from 'react';

const createNotifications = (userIds, notificationType, documentType, documentId) => {
  userIds.forEach(userId => {

    let user = Users.findOne({ _id:userId });

    let notificationData = {
      userId: userId,
      documentId: documentId,
      documentType: documentType,
      message: notificationMessage(notificationType, documentType, documentId),
      type: notificationType,
      link: getLink(documentType, documentId),
    }

    newMutation({
      action: 'notifications.new',
      collection: Notifications,
      document: notificationData,
      currentUser: user,
      validate: false
    });
  });
}

const sendPostByEmail = async (users, postId, reason) => {
  let post = Posts.findOne(postId);

  for(let user of users) {
    if(!reasonUserCantReceiveEmails(user)) {
      await renderAndSendEmail({
        user,
        subject: post.title,
        bodyComponent: <Components.EmailWrapper>
          <Components.NewPostEmail documentId={post._id} reason={reason}/>
        </Components.EmailWrapper>
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${user.username} when emailing: ${reasonUserCantReceiveEmails(user)}`);
    }
  }
}

const getLink = (documentType, documentId) => {
  let document = getDocument(documentType, documentId);

  switch(documentType) {
    case "post":
      return Posts.getPageUrl(document);
    case "comment":
      return Comments.getPageUrl(document);
    case "user":
      return Users.getProfileUrl(document);
    case "message":
      return Messages.getLink(document);
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid notification type");
  }
}

const notificationMessage = (notificationType, documentType, documentId) => {
  let document = getDocument(documentType, documentId);
  let group = {}
  if (documentType == "post" && document.groupId) {
    group = Localgroups.findOne(document.groupId);
  }

  switch(notificationType) {
    case "newPost":
      return Posts.getAuthorName(document) + ' has created a new post: ' + document.title;
    case "newPendingPost":
      return Posts.getAuthorName(document) + ' has a new post pending approval ' + document.title;
    case "postApproved":
      return 'Your post "' + document.title + '" has been approved';
    case "newEvent":
        return Posts.getAuthorName(document) + ' has created a new event in the group "' + group.name + '"';
    case "newGroupPost":
        return Posts.getAuthorName(document) + ' has created a new post in the group "' + group.name + '"';
    case "newComment":
      return Comments.getAuthorName(document) + ' left a new comment on "' + Posts.findOne(document.postId).title + '"';
    case "newReply":
      return Comments.getAuthorName(document) + ' replied to a comment on "' + Posts.findOne(document.postId).title + '"';
    case "newReplyToYou":
        return Comments.getAuthorName(document) + ' replied to your comment on "' + Posts.findOne(document.postId).title + '"';
    case "newUser":
      return document.displayName + ' just signed up!';
    case "newMessage":
      let conversation = Conversations.findOne(document.conversationId);
      return Users.findOne(document.userId).displayName + ' sent you a new message' + (conversation.title ? (' in the conversation ' + conversation.title) : "") + '!';
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid notification type");
  }
}

const getDocument = (documentType, documentId) => {
  switch(documentType) {
    case "post":
      return Posts.findOne(documentId);
    case "comment":
      return Comments.findOne(documentId);
    case "user":
      return Users.findOne(documentId);
    case "message":
      return Messages.findOne(documentId);
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid documentType type");
  }
}


/**
 * @summary Add notification callback when a post is approved
 */
function PostsApprovedNotification(post) {
  createNotifications([post.userId], 'postApproved', 'post', post._id);
}
addCallback("posts.approve.async", PostsApprovedNotification);

function PostsUndraftNotification(post) {
  //eslint-disable-next-line no-console
  console.info("Post undrafted, creating notifications");

  postsNewNotifications(post);
}
addCallback("posts.undraft.async", PostsUndraftNotification);

// Add new post notification callback on post submit
function postsNewNotifications (post) {
  if (!post.draft && post.status === Posts.config.STATUS_APPROVED) {
    // Removed because this was useless. Will be reintroduced in a different
    // form (with advanced filters and emailing.)
    //let usersToNotify = _.pluck(Users.find({'notifications_posts': true}, {fields: {_id:1}}).fetch(), '_id');
    let usersToNotify = [];

    // add users who are subscribed to this post's author
    const postAuthor = Users.findOne(post.userId);
    if (!!postAuthor.subscribers) {
      usersToNotify = _.union(usersToNotify, postAuthor.subscribers);
    }

    // add users who are subscribed to this post's groups
    if (post.groupId) {
      const group = Localgroups.findOne(post.groupId);
      if (group.subscribers) {
        usersToNotify = _.union(usersToNotify, group.subscribers);
      }
    }
    // remove this post's author
    usersToNotify = _.without(usersToNotify, post.userId);

    if (post.groupId && post.isEvent) {
      createNotifications(usersToNotify, 'newEvent', 'post', post._id);
    } else if (post.groupId && !post.isEvent) {
      createNotifications(usersToNotify, 'newGroupPost', 'post', post._id);
    } else {
      createNotifications(usersToNotify, 'newPost', 'post', post._id);
    }

  }
}
addCallback("posts.new.async", postsNewNotifications);

function findUsersToEmail(filter) {
  let usersMatchingFilter = Users.find(filter, {fields: {_id:1, email:1, emails:1}}).fetch();

  let usersToEmail = usersMatchingFilter.filter(u => {
    if (u.email && u.emails && u.emails.length) {
      let primaryAddress = u.email;

      for(let i=0; i<u.emails.length; i++)
      {
        if(u.emails[i].address === primaryAddress && u.emails[i].verified)
          return true;
      }
      return false;
    } else {
      return false;
    }
  });
  return usersToEmail
}

function PostsCurateNotification (post, oldPost) {
  if(post.curatedDate && !oldPost.curatedDate) {
    let usersToEmail = findUsersToEmail({'emailSubscribedToCurated': true});
    sendPostByEmail(usersToEmail, post._id, "you have the \"Email me new posts in Curated\" option enabled");
  }
}
addCallback("posts.edit.async", PostsCurateNotification);

// add new comment notification callback on comment submit
async function CommentsNewNotifications(comment) {
  // note: dummy content has disableNotifications set to true
  if(Meteor.isServer && !comment.disableNotifications) {

    const post = await Posts.findOne(comment.postId);

    // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
    // if e.g. they're both the author of the post and the author of a comment being replied to)
    let notifiedUsers = [];

    // 1. Notify users who are subscribed to the parent comment
    if (!!comment.parentCommentId) {
      const parentComment = Comments.findOne(comment.parentCommentId);

      if (!!parentComment.subscribers && !!parentComment.subscribers.length) {
        // remove userIds of users that have already been notified
        // and of comment and parentComment author (they could be replying in a thread they're subscribed to)
        let parentCommentSubscribersToNotify = _.difference(parentComment.subscribers, notifiedUsers, [comment.userId, parentComment.userId]);
        createNotifications(parentCommentSubscribersToNotify, 'newReply', 'comment', comment._id);
        notifiedUsers = [...notifiedUsers, ...parentCommentSubscribersToNotify];

        // Separately notify author of comment with different notification, if they are subscribed, and are NOT the author of the comment
        if (parentComment.subscribers.includes(parentComment.userId) && parentComment.userId !== comment.userId) {
          createNotifications([parentComment.userId], 'newReplyToYou', 'comment', comment._id);
          notifiedUsers = [...notifiedUsers, parentComment.userId];
        }
      }
    }

    // 2. Notify users who are subscribed to the post (which may or may not include the post's author)
    if (post && post.subscribers && post.subscribers.length) {
      // remove userIds of users that have already been notified
      // and of comment author (they could be replying in a thread they're subscribed to)
      let postSubscribersToNotify = _.difference(post.subscribers, notifiedUsers, [comment.userId]);
      createNotifications(postSubscribersToNotify, 'newComment', 'comment', comment._id);
    }
  }
}
addCallback("comments.new.async", CommentsNewNotifications);

function messageNewNotification(message) {
  const conversation = Conversations.findOne(message.conversationId);
  //Make sure to not notify the author of the message
  const notifees = conversation.participantIds.filter((id) => (id !== message.userId));

  createNotifications(notifees, 'newMessage', 'message', message._id);
}
addCallback("messages.new.async", messageNewNotification);