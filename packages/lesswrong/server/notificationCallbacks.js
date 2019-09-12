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
import './emailComponents/PrivateMessagesEmail.jsx';
import { EventDebouncer } from './debouncer.js';
import { UnsubscribeAllToken } from './emails/emailTokens.js';

import { Components, addCallback, newMutation } from 'meteor/vulcan:core';

import React from 'react';
import keyBy from 'lodash/keyBy';
import Sentry from '@sentry/node';

const createNotifications = async (userIds, notificationType, documentType, documentId) => {
  return Promise.all(
    userIds.map(async userId => {
      let user = Users.findOne({ _id:userId });
  
      let notificationData = {
        userId: userId,
        documentId: documentId,
        documentType: documentType,
        message: notificationMessage(notificationType, documentType, documentId),
        type: notificationType,
        link: getLink(notificationType, documentType, documentId),
      }
  
      await newMutation({
        action: 'notifications.new',
        collection: Notifications,
        document: notificationData,
        currentUser: user,
        validate: false
      });
    })
  );
}

const sendPostByEmail = async (users, postId, reason) => {
  let post = await Posts.findOne(postId);

  for(let user of users) {
    if(!reasonUserCantReceiveEmails(user)) {
      try {
        const unsubscribeAllLink = await UnsubscribeAllToken.generateLink(user._id);
        await renderAndSendEmail({
          user,
          subject: post.title,
          bodyComponent: <Components.EmailWrapper
            user={user}
            unsubscribeAllLink={unsubscribeAllLink}
          >
            <Components.NewPostEmail documentId={post._id} reason={reason}/>
          </Components.EmailWrapper>
        });
      } catch(e) {
        Sentry.captureException(e);
      }
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${user.username} when emailing: ${reasonUserCantReceiveEmails(user)}`);
    }
  }
}

const getLink = (notificationType, documentType, documentId) => {
  let document = getDocument(documentType, documentId);

  switch(notificationType) {
    case "emailVerificationRequired":
      return "/resendVerificationEmail";
    default:
      // Fall through to based on document-type
      break;
  }
  
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
    case "emailVerificationRequired":
      return "Verify your email address to activate email subscriptions.";
    case "postSharedWithUser":
      return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid notification type");
  }
}

const getDocument = (documentType, documentId) => {
  if (!documentId) return null;
  
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
      console.error(`Invalid documentType type: ${documentType}`);
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
  let usersMatchingFilter = Users.find(filter).fetch();

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

const curationEmailDelay = new EventDebouncer({
  name: "curationEmail",
  delayMinutes: 20,
  callback: async (postId) => {
    const post = await Posts.findOne(postId);
    
    // Still curated? If it was un-curated during the 20 minute delay, don't
    // send emails.
    if (post.curatedDate) {
      let usersToEmail = findUsersToEmail({'emailSubscribedToCurated': true});
      sendPostByEmail(usersToEmail, postId, "you have the \"Email me new posts in Curated\" option enabled");
    } else {
      //eslint-disable-next-line no-console
      console.log(`Not sending curation notice for ${post.title} because it was un-curated during the delay period.`);
    }
  }
});

function PostsCurateNotification (post, oldPost) {
  if(post.curatedDate && !oldPost.curatedDate) {
    curationEmailDelay.recordEvent({
      key: post._id,
      data: null,
      af: false
    });
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

async function sendPrivateMessagesEmail(conversationId, messageIds) {
  const conversation = await Conversations.findOne(conversationId);
  const participants = await Users.find({_id: {$in: conversation.participantIds}}).fetch();
  const participantsById = keyBy(participants, u=>u._id);
  const messages = await Messages.find(
    {_id: {$in: messageIds}},
    { sort: {createdAt:1} })
    .fetch();
  
  for (const recipientUser of participants)
  {
    // TODO: Gradual rollout--only email admins with this. Remove later when
    // this is more tested.
    if (!Users.isAdmin(recipientUser))
      continue;
    
    // If this user is responsible for every message that would be in the
    // email, don't send it to them (you only want emails that contain at
    // least one message that's not your own; your own messages are optional
    // context).
    if (!_.some(messages, message=>message.userId !== recipientUser._id))
      continue;
    
    const otherParticipants = _.filter(participants, u=>u._id != recipientUser._id);
    const subject = `Private message conversation with ${otherParticipants.map(u=>u.displayName).join(', ')}`;
    
    if(!reasonUserCantReceiveEmails(recipientUser)) {
      const unsubscribeAllLink = await UnsubscribeAllToken.generateLink(recipientUser._id);
      await renderAndSendEmail({
        user: recipientUser,
        subject: subject,
        bodyComponent: <Components.EmailWrapper
          user={recipientUser}
          unsubscribeAllLink={unsubscribeAllLink}
        >
          <Components.PrivateMessagesEmail
            conversation={conversation}
            messages={messages}
            participantsById={participantsById}
          />
        </Components.EmailWrapper>
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${recipientUser.username} when emailing: ${reasonUserCantReceiveEmails(recipientUser)}`);
    }
  }
}

const privateMessagesDebouncer = new EventDebouncer({
  name: "privateMessage",
  delayMinutes: 15,
  maxDelayMinutes: 30,
  callback: sendPrivateMessagesEmail
});

function messageNewNotification(message) {
  const conversationId = message.conversationId;
  const conversation = Conversations.findOne(conversationId);
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipients = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create on-site notification
  createNotifications(recipients, 'newMessage', 'message', message._id);
  
  // Generate debounced email notifications
  privateMessagesDebouncer.recordEvent({
    key: conversationId,
    data: message._id,
    af: conversation.af,
  });
}
addCallback("messages.new.async", messageNewNotification);

export async function bellNotifyEmailVerificationRequired (user) {
  await createNotifications([user._id], 'emailVerificationRequired', null, null);
}

async function PostsEditNotifyUsersSharedOnPost (newPost, oldPost) {
  if (!_.isEqual(newPost.shareWithUsers, oldPost.shareWithUsers)) {
    // Right now this only creates notifications when users are shared (and not when they are "unshared")
    // because currently notifications are hidden from you if you don't have view-access to a post.
    // TODO: probably fix that, such that users can see when they've lost access to post. [but, eh, I'm not sure this matters that much]
    const sharedUsers = _.difference(newPost.shareWithUsers || [], oldPost.shareWithUsers || [])
    createNotifications(sharedUsers, "postSharedWithUser", "post", newPost._id)
  }
}
addCallback("posts.edit.async", PostsEditNotifyUsersSharedOnPost);

async function PostsNewNotifyUsersSharedOnPost (post) {
  if (post.shareWithUsers?.length) {
    createNotifications(post.shareWithUsers, "postSharedWithUser", "post", post._id)
  }
}
addCallback("posts.new.async", PostsNewNotifyUsersSharedOnPost);
