import Notifications from '../lib/collections/notifications/collection.js';
import Messages from '../lib/collections/messages/collection.js';
import Conversations from '../lib/collections/conversations/collection.js';
import Subscriptions from '../lib/collections/subscriptions/collection.js';
import { subscriptionTypes } from '../lib/collections/subscriptions/schema';
import Localgroups from '../lib/collections/localgroups/collection.js';
import Users from 'meteor/vulcan:users';
import { Posts } from '../lib/collections/posts';
import { Comments } from '../lib/collections/comments'
import { reasonUserCantReceiveEmails } from './emails/renderEmail.js';
import './emailComponents/EmailWrapper.jsx';
import './emailComponents/NewPostEmail.jsx';
import './emailComponents/PrivateMessagesEmail.jsx';
import { EventDebouncer } from './debouncer.js';
import { getNotificationTypeByName } from '../lib/notificationTypes.jsx';
import { notificationDebouncers, wrapAndSendEmail } from './notificationBatching.js';
import { defaultNotificationTypeSettings } from '../lib/collections/users/custom_fields.js';

import { Components, addCallback, createMutator } from 'meteor/vulcan:core';

import React from 'react';
import keyBy from 'lodash/keyBy';

// Return a list of users (as complete user objects) subscribed to a given
// document. This is the union of users who have subscribed to it explicitly,
// and users who were subscribed to it by default and didn't suppress the
// subscription.
//
// documentId: The document to look for subscriptions to.
// collectionName: The collection the document to look for subscriptions to is in.
// type: The type of subscription to check for.
// potentiallyDefaultSubscribedUserIds: (Optional) An array of user IDs for
//   users who are potentially subscribed to this document by default, eg
//   because they wrote the post being replied to or are an organizer of the
//   group posted in.
// userIsDefaultSubscribed: (Optional. User=>bool) If
//   potentiallyDefaultSubscribedUserIds is given, takes a user and returns
//   whether they would be default-subscribed to this document.
async function getSubscribedUsers({
  documentId, collectionName, type,
  potentiallyDefaultSubscribedUserIds=null, userIsDefaultSubscribed=null
}) {
  const subscriptions = await Subscriptions.find({documentId, type, collectionName, deleted: false, state: 'subscribed'}).fetch()
  const explicitlySubscribedUserIds = _.pluck(subscriptions, 'userId')
  
  const explicitlySubscribedUsers = await Users.find({_id: {$in: explicitlySubscribedUserIds}}).fetch()
  const explicitlySubscribedUsersDict = keyBy(explicitlySubscribedUsers, u=>u._id);
  
  // Handle implicitly subscribed users
  if (potentiallyDefaultSubscribedUserIds && potentiallyDefaultSubscribedUserIds.length>0) {
    // Filter explicitly-subscribed users out of the potentially-implicitly-subscribed
    // users list, since their subscription status is already known
    potentiallyDefaultSubscribedUserIds = _.filter(potentiallyDefaultSubscribedUserIds, id=>!(id in explicitlySubscribedUsersDict));
    
    // Fetch and filter potentially-subscribed users
    const potentiallyDefaultSubscribedUsers = await Users.find({
      _id: {$in: potentiallyDefaultSubscribedUserIds}
    }).fetch();
    const defaultSubscribedUsers = _.filter(potentiallyDefaultSubscribedUsers, userIsDefaultSubscribed);
    
    // Check for suppression in the subscriptions table
    const suppressions = await Subscriptions.find({documentId, type, collectionName, deleted: false, state: "suppressed"}).fetch();
    const suppressionsByUserId = keyBy(suppressions, s=>s.userId);
    const defaultSubscribedUsersNotSuppressed = _.filter(defaultSubscribedUsers, u=>!(u._id in suppressionsByUserId))
    
    return _.union(explicitlySubscribedUsers, defaultSubscribedUsersNotSuppressed);
  } else {
    return explicitlySubscribedUsers;
  }
}

const createNotifications = async (userIds, notificationType, documentType, documentId) => {
  return Promise.all(
    userIds.map(async userId => {
      createNotification(userId, notificationType, documentType, documentId);
    })
  );
}

const getNotificationTiming = (typeSettings) => {
  switch (typeSettings.batchingFrequency) {
    case "realtime":
      return { type: "none" };
    case "daily":
      return {
        type: "daily",
        timeOfDayGMT: typeSettings.timeOfDayGMT,
      };
    case "weekly":
      return {
        type: "weekly",
        timeOfDayGMT: typeSettings.timeOfDayGMT,
        dayOfWeekGMT: typeSettings.dayOfWeekGMT,
      };
    default:
      // eslint-disable-next-line no-console
      console.error(`Unrecognized batching frequency: ${typeSettings.batchingFrequency}`);
      return { type: "none" };
  }
}

const createNotification = async (userId, notificationType, documentType, documentId) => {
  let user = Users.findOne({ _id:userId });
  const userSettingField = getNotificationTypeByName(notificationType).userSettingField;
  const notificationTypeSettings = (userSettingField && user[userSettingField]) ? user[userSettingField] : defaultNotificationTypeSettings;

  let notificationData = {
    userId: userId,
    documentId: documentId,
    documentType: documentType,
    message: notificationMessage(notificationType, documentType, documentId),
    type: notificationType,
    link: getLink(notificationType, documentType, documentId),
  }

  if (notificationTypeSettings.channel === "onsite" || notificationTypeSettings.channel === "both")
  {
    createMutator({
      collection: Notifications,
      document: {
        ...notificationData,
        emailed: false,
        waitingForBatch: notificationTypeSettings.batchingFrequency !== "realtime",
      },
      currentUser: user,
      validate: false
    });
  }
  if (notificationTypeSettings.channel === "email" || notificationTypeSettings.channel === "both") {
    const createdNotification = await createMutator({
      collection: Notifications,
      document: {
        ...notificationData,
        emailed: true,
        waitingForBatch: true,
      },
      currentUser: user,
      validate: false
    });
    await notificationDebouncers[notificationType].recordEvent({
      key: {notificationType, userId},
      data: createdNotification.data._id,
      timing: getNotificationTiming(notificationTypeSettings),
      af: false, //TODO: Handle AF vs non-AF notifications
    });
  }
}

const sendPostByEmail = async (users, postId, reason) => {
  let post = await Posts.findOne(postId);

  for(let user of users) {
    if(!reasonUserCantReceiveEmails(user)) {
      await wrapAndSendEmail({
        user,
        subject: post.title,
        body: <Components.NewPostEmail documentId={post._id} reason={reason}/>
      });
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
  return getNotificationTypeByName(notificationType)
    .getMessage({documentType, documentId});
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
async function PostsApprovedNotification(post) {
  await createNotifications([post.userId], 'postApproved', 'post', post._id);
}
addCallback("posts.approve.async", PostsApprovedNotification);

async function PostsUndraftNotification(post) {
  //eslint-disable-next-line no-console
  console.info("Post undrafted, creating notifications");

  await postsNewNotifications(post);
}
addCallback("posts.undraft.async", PostsUndraftNotification);

// Add new post notification callback on post submit
async function postsNewNotifications (post) {
  if (!post.draft && post.status === Posts.config.STATUS_APPROVED) {

    // add users who are subscribed to this post's author
    let usersToNotify = await getSubscribedUsers({
      documentId: post.userId,
      collectionName: "Users",
      type: subscriptionTypes.newPosts
    })

    // add users who are subscribed to this post's groups
    if (post.groupId) {
      // Load the group, so we know who the organizers are
      const group = await Localgroups.findOne(post.groupId);
      const organizerIds = group.organizers;
      
      const subscribedUsers = await getSubscribedUsers({
        documentId: post.groupId,
        collectionName: "Localgroups",
        type: subscriptionTypes.newEvents,
        potentiallyDefaultSubscribedUserIds: organizerIds,
        userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer,
      });
      usersToNotify = _.union(usersToNotify, subscribedUsers)
    }
    
    // remove this post's author
    usersToNotify = _.without(usersToNotify, post.userId);
    
    const userIdsToNotify = _.map(usersToNotify, u=>u._id);

    if (post.groupId && post.isEvent) {
      await createNotifications(userIdsToNotify, 'newEvent', 'post', post._id);
    } else if (post.groupId && !post.isEvent) {
      await createNotifications(userIdsToNotify, 'newGroupPost', 'post', post._id);
    } else {
      await createNotifications(userIdsToNotify, 'newPost', 'post', post._id);
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
  defaultTiming: {
    type: "delayed",
    delayMinutes: 20,
  },
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
    // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
    // if e.g. they're both the author of the post and the author of a comment being replied to)
    let notifiedUsers = [];

    // 1. Notify users who are subscribed to the parent comment
    if (comment.parentCommentId) {
      const parentComment = Comments.findOne(comment.parentCommentId)
      const subscribedUsers = await getSubscribedUsers({
        documentId: comment.parentCommentId,
        collectionName: "Comments",
        type: subscriptionTypes.newReplies,
        potentiallyDefaultSubscribedUserIds: [parentComment.userId],
        userIsDefaultSubscribed: u => u.auto_subscribe_to_my_comments
      })
      const subscribedUserIds = _.map(subscribedUsers, u=>u._id);
      
      // Don't notify the author of their own comment, and filter out the author
      // of the parent-comment to be treated specially (with a newReplyToYou
      // notification instead of a newReply notification).
      let parentCommentSubscriberIdsToNotify = _.difference(subscribedUserIds, [comment.userId, parentComment.userId])
      await createNotifications(parentCommentSubscriberIdsToNotify, 'newReply', 'comment', comment._id);

      // Separately notify author of comment with different notification, if
      // they are subscribed, and are NOT the author of the comment
      if (subscribedUsers.includes(parentComment.userId) && parentComment.userId !== comment.userId) {
        await createNotifications([parentComment.userId], 'newReplyToYou', 'comment', comment._id);
        notifiedUsers = [...notifiedUsers, parentComment.userId];
      }
    }
    
    // 2. Notify users who are subscribed to the post (which may or may not include the post's author)
    const post = await Posts.findOne(comment.postId);
    const usersSubscribedToPost = await getSubscribedUsers({
      documentId: comment.postId,
      collectionName: "Posts",
      type: subscriptionTypes.newComments,
      potentiallyDefaultSubscribedUserIds: [post.userId],
      userIsDefaultSubscribed: u => u.auto_subscribe_to_my_posts
    })
    const userIdsSubscribedToPost = _.map(usersSubscribedToPost, u=>u._id);
    
    // remove userIds of users that have already been notified
    // and of comment author (they could be replying in a thread they're subscribed to)
    const postSubscriberIdsToNotify = _.difference(userIdsSubscribedToPost, [...notifiedUsers, comment.userId])
    if (postSubscriberIdsToNotify.length > 0) {
      await createNotifications(postSubscriberIdsToNotify, 'newComment', 'comment', comment._id)
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
      await wrapAndSendEmail({
        user: recipientUser,
        subject: subject,
        body: <Components.PrivateMessagesEmail
          conversation={conversation}
          messages={messages}
          participantsById={participantsById}
        />
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${recipientUser.username} when emailing: ${reasonUserCantReceiveEmails(recipientUser)}`);
    }
  }
}

const privateMessagesDebouncer = new EventDebouncer({
  name: "privateMessage",
  defaultTiming: {
    type: "delayed",
    delayMinutes: 15,
    maxDelayMinutes: 30,
  },
  callback: sendPrivateMessagesEmail
});

async function messageNewNotification(message) {
  const conversationId = message.conversationId;
  const conversation = Conversations.findOne(conversationId);
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipientIds = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create on-site notification
  await createNotifications(recipientIds, 'newMessage', 'message', message._id);
  
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
  createNotifications(newPost.shareWithUsers, "postSharedWithUser", "post", newPost._id) //DEBUG
}
addCallback("posts.edit.async", PostsEditNotifyUsersSharedOnPost);

async function PostsNewNotifyUsersSharedOnPost (post) {
  if (post.shareWithUsers?.length) {
    createNotifications(post.shareWithUsers, "postSharedWithUser", "post", post._id)
  }
}
addCallback("posts.new.async", PostsNewNotifyUsersSharedOnPost);
