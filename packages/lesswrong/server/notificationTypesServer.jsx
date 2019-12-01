import React from 'react';
import { Components } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts/collection.js';
import { Comments } from '../lib/collections/comments/collection.js';
import { Localgroups } from '../lib/collections/localgroups/collection.js';
import { Messages } from '../lib/collections/messages/collection.js';
import { Conversations } from '../lib/collections/conversations/collection.js';
import { accessFilterMultiple } from '../lib/modules/utils/schemaUtils.js';
import keyBy from 'lodash/keyBy';
import Users from 'meteor/vulcan:users';
import './emailComponents/EmailComment.jsx';
import './emailComponents/PrivateMessagesEmail.jsx';
import moment from 'moment-timezone';
import { getLocalTime } from './mapsUtils'

const notificationTypes = {};

export const getNotificationTypeByNameServer = (name) => {
  if (name in notificationTypes)
    return notificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}

const serverRegisterNotificationType = (notificationTypeClass) => {
  const name = notificationTypeClass.name;
  notificationTypes[name] = notificationTypeClass;
  return notificationTypeClass;
}

export const NewPostNotification = serverRegisterNotificationType({
  name: "newPost",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    const post = await Posts.findOne({_id: postId});
    return post.title;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = serverRegisterNotificationType({
  name: "postApproved",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification";
  },
  emailBody: ({ user, notifications }) => {
  },
});

export const NewEventNotification = serverRegisterNotificationType({
  name: "newEvent",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    const post = Posts.findOne(notifications[0].documentId);
    return post.title;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

export const NewGroupPostNotification = serverRegisterNotificationType({
  name: "newGroupPost",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    const post = Posts.findOne(notifications[0].documentId);
    const group = Localgroups.findOne(post?.groupId);
    return `New post in group ${group?.name}`;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

export const NewCommentNotification = serverRegisterNotificationType({
  name: "newComment",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    if (notifications.length > 1) {
      return `${notifications.length} comments on posts you subscribed to`;
    } else {
      const comment = Comments.findOne(notifications[0].documentId);
      const author = Users.findOne(comment.userId);
      return `${author.displayName} commented on a post you subscribed to`;
    }
  },
  emailBody: ({ user, notifications }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = accessFilterMultiple(user, Comments, commentsRaw);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewReplyNotification = serverRegisterNotificationType({
  name: "newReply",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    if (notifications.length > 1) {
      return `${notifications.length} replies to comments you're subscribed to`;
    } else {
      const comment = Comments.findOne(notifications[0].documentId);
      const author = Users.findOne(comment.userId);
      return `${Users.getDisplayName(author)} replied to a comment you're subscribed to`;
    }
  },
  emailBody: ({ user, notifications }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = accessFilterMultiple(user, Comments, commentsRaw);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewReplyToYouNotification = serverRegisterNotificationType({
  name: "newReplyToYou",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    if (notifications.length > 1) {
      return `${notifications.length} replies to your comments`;
    } else {
      const comment = Comments.findOne(notifications[0].documentId);
      const author = Users.findOne(comment.userId);
      return `${Users.getDisplayName(author)} replied to your comment`;
    }
  },
  emailBody: ({ user, notifications }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = accessFilterMultiple(user, Comments, commentsRaw);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = serverRegisterNotificationType({
  name: "newUser",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification";
  },
  emailBody: ({ user, notifications }) => {
  },
});

export const NewMessageNotification = serverRegisterNotificationType({
  name: "newMessage",
  loadData: function({ user, notifications }) {
    // Load messages
    const messageIds = notifications.map(notification => notification.documentId);
    const messagesRaw = Messages.find({ _id: {$in: messageIds} }).fetch();
    const messages = accessFilterMultiple(user, Messages, messagesRaw);
    
    // Load conversations
    const messagesByConversationId = keyBy(messages, message=>message.conversationId);
    const conversationIds = _.keys(messagesByConversationId);
    const conversationsRaw = Conversations.find({ _id: {$in: conversationIds} }).fetch();
    const conversations = accessFilterMultiple(user, Conversations, conversationsRaw);
    
    // Load participant users
    const participantIds = _.uniq(_.flatten(conversations.map(conversation => conversation.participantIds), true));
    const participantsRaw = Users.find({ _id: {$in: participantIds} }).fetch();
    const participants = accessFilterMultiple(user, Users, participantsRaw);
    const participantsById = keyBy(participants, u=>u._id);
    const otherParticipants = _.filter(participants, id=>id!=user._id);
    
    return { conversations, messages, participantsById, otherParticipants };
  },
  emailSubject: function({ user, notifications }) {
    const { conversations, otherParticipants } = this.loadData({ user, notifications });
    
    const otherParticipantNames = otherParticipants.map(u=>Users.getDisplayName(u)).join(', ');
    
    return `Private message conversation${conversations.length>1 ? 's' : ''} with ${otherParticipantNames}`;
  },
  emailBody: function({ user, notifications }) {
    const { conversations, messages, participantsById } = this.loadData({ user, notifications });
    
    return <Components.PrivateMessagesEmail
      conversations={conversations}
      messages={messages}
      participantsById={participantsById}
    />
  },
});

// This notification type should never be emailed (but is displayed in the
// on-site UI).
export const EmailVerificationRequiredNotification = serverRegisterNotificationType({
  name: "emailVerificationRequired",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
  emailBody: ({ user, notifications }) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
});

export const PostSharedWithUserNotification = serverRegisterNotificationType({
  name: "postSharedWithUser",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    let post = Posts.findOne(notifications[0].documentId);
    return `You have been shared on the ${post.draft ? "draft" : "post"} ${post.title}`;
  },
  emailBody: ({ user, notifications }) => {
    const post = Posts.findOne(notifications[0].documentId);
    const link = Posts.getPageUrl(post, true);
    return <p>
      You have been shared on the {post.draft ? "draft" : "post"} <a href={link}>{post.title}</a>.
    </p>
  },
});


const eventTimeFormat = "Do MMMM YYYY h:mm A"
const getEventEmailBody = async (openingSentence, notifications) => {
  const post = Posts.findOne(notifications[0].documentId);
  const link = Posts.getPageUrl(post, true);
  const eventStartTime = await getLocalTime(post.startTime, post.googleLocation)
  const eventEndTime = post.endTime && await getLocalTime(post.endTime, post.googleLocation)
  return <div>
    <p>
      {openingSentence}: <a href={link}>{post.title}</a>.
    </p>
    <p>
      Location: {post.location}
    </p>
    {/* getLocalTime returns event time in UTC, so we run moment in UTC mode */}
    <p>
      Start Time: {moment(eventStartTime).utc().format(eventTimeFormat)}
    </p>
    {eventEndTime && <p>
      End Time: {moment(eventEndTime).utc().format(eventTimeFormat)}
    </p>}
  </div>
}

export const NewEventInRadiusNotification = serverRegisterNotificationType({
  name: "newEventInRadius",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    let post = Posts.findOne(notifications[0].documentId);
    return `A new event has been created in your area: ${post.title}`;
  },
  emailBody: async ({ user, notifications }) => {
    return getEventEmailBody("A new event has been created in your area", notifications)
  },
});

export const EditedEventInRadiusNotification = serverRegisterNotificationType({
  name: "editedEventInRadius",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    let post = Posts.findOne(notifications[0].documentId);
    return `An event in your area has been edited: ${post.title}`;
  },
  emailBody: async ({ user, notifications }) => {
    return getEventEmailBody("An event in your area has been edited", notifications)
  },
});

